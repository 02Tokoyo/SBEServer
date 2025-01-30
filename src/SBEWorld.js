// src/SBEWorld.js
const { randomUUID } = require("node:crypto");
const Logger = require("./util/Logger");
const ScoreboardManager = require("./managers/ScoreboardManager");
const TimeoutError = require("./structures/TimeoutError");
const Util = require("./util/Util");
const ServerEvents = require("./util/Events");

class SBEWorld {
  #awaitingResponses = new Map(); // requestId -> callback
  #responseTimes = [];
  #countInterval = null;

  constructor(server, session, name) {
    this.server = server;
    this.session = session; // ScriptBridgeの Session インスタンス
    this.name = name;
    this.id = randomUUID();
    this.logger = new Logger(this.name, this.server.option);
    this.connectedAt = Date.now();

    this.lastPlayers = [];
    this.maxPlayers = 0;
    this.scoreboards = new ScoreboardManager(this);
    this.localPlayer = null;
  }

  get ping() {
    return Util.median(this.#responseTimes);
  }

  /**
   * ScriptBridge でサーバへ送信
   */
  sendPacket(packet) {
    this.session
      .send("custom:packet", packet) // customチャンネルで送信
      .catch((err) => this.logger.error("Failed to send packet:", err));

    // イベント通知
    this.server.events.emit(ServerEvents.PacketSend, { packet, world: this });
  }

  /**
   * コマンド実行 → 応答を待つ
   */
  async runCommand(command) {
    // コマンド用パケット生成
    const packet = Util.commandBuilder(
      command,
      this.server.option.commandVersion
    );
    this.sendPacket(packet);

    // tellraw など応答が無いコマンドの例外処理
    if (command.startsWith("tellraw")) return {};

    // await
    return await this.#getResponse(packet);
  }

  /**
   * プレイヤーへメッセージ送信
   */
  async sendMessage(message, target = "@a") {
    if (!/^@(?:s|p|a|r|e)$/.test(target) && !target.startsWith("@")) {
      target = `"${target}"`;
    }

    const rawtext =
      typeof message === "object"
        ? message
        : { rawtext: [{ text: String(message) }] };

    await this.runCommand(`tellraw ${target} ${JSON.stringify(rawtext)}`);
  }

  /**
   * 実際に応答を待つ部分
   */
  #getResponse(packet) {
    const requestId = packet.header.requestId;
    const sendTime = Date.now();

    return new Promise((resolve, reject) => {
      // タイムアウト
      const timer = setTimeout(() => {
        reject(new TimeoutError(`Response timeout for ${requestId}`));
      }, this.server.option.packetTimeout);

      // コールバック登録
      this.#awaitingResponses.set(requestId, (response) => {
        clearTimeout(timer);
        if (this.#responseTimes.length > 20) this.#responseTimes.shift();
        this.#responseTimes.push(Date.now() - sendTime);

        resolve(response);
      });
    });
  }

  /**
   * ScriptBridgeServer から受け取ったパケットを処理
   */
  _handlePacket(packet) {
    const { header, body } = packet;

    // 応答待ちのものがあれば解決
    if (header?.requestId && this.#awaitingResponses.has(header.requestId)) {
      this.#awaitingResponses.get(header.requestId)(body);
      this.#awaitingResponses.delete(header.requestId);
    }

    // 例: チャットイベントなど (type=chat)
    if (header?.eventName === "PlayerMessage") {
      if (body.type === "title") {
        this.server.events.emit(ServerEvents.PlayerTitle, {
          ...body,
          world: this,
        });
      } else {
        this.server.events.emit(ServerEvents.PlayerChat, {
          ...body,
          world: this,
        });
      }
    }

    // ほか、SocketBE独自イベント "commandResponse" とか
    if (["commandResponse", "error"].includes(header?.messagePurpose)) {
      // ここでは特に追加処理は不要。既に requestId で解決済み。
    }
  }

  /**
   * タイマー開始 (PlayerJoin/Leave検知用)
   */
  _startInterval() {
    if (this.#countInterval) return;
    this.#updatePlayers();
    this.#countInterval = setInterval(
      () => this.#updatePlayers(),
      this.server.option.listUpdateInterval
    );
  }

  _stopInterval() {
    if (this.#countInterval) {
      clearInterval(this.#countInterval);
      this.#countInterval = null;
    }
  }

  async #updatePlayers() {
    try {
      const { players, max } = await this.getPlayerList();
      const join = players.filter((p) => !this.lastPlayers.includes(p));
      const leave = this.lastPlayers.filter((p) => !players.includes(p));

      this.lastPlayers = players;
      this.maxPlayers = max;

      if (join.length > 0) {
        this.server.events.emit(ServerEvents.PlayerJoin, {
          world: this,
          players: join,
        });
      }
      if (leave.length > 0) {
        this.server.events.emit(ServerEvents.PlayerLeave, {
          world: this,
          players: leave,
        });
      }
    } catch (e) {
      // エラー時は無視
    }
  }

  /**
   * プレイヤー一覧
   */
  async getPlayerList() {
    const data = await this.runCommand("list");
    const status = data.statusCode == 0;
    const players = status ? (data.players || "").split(", ") : [];
    const formattedPlayers = players.map(
      (name) => this.server.option.formatter.playerName?.(name) ?? name
    );
    return {
      current: status ? data.currentPlayerCount : 0,
      max: status ? data.maxPlayerCount : 0,
      players: formattedPlayers,
    };
  }

  /**
   * ローカルプレイヤー名取得
   */
  async getLocalPlayer() {
    const res = await this.runCommand("getlocalplayername");
    const player = res.localplayername;
    this.localPlayer =
      this.server.option.formatter.playerName?.(player) ?? player;
    return this.localPlayer;
  }

  /**
   * 切断
   */
  disconnect() {
    this.session.disconnect();
  }

  /**
   * (deprecated)
   */
  close() {
    this.logger.warn("World.close() is deprecated. Use disconnect() instead.");
    this.disconnect();
  }
}

module.exports = SBEWorld;
