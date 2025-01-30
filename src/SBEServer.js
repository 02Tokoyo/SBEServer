// src/SBEServer.js

const { ScriptBridgeServer } = require("@script-bridge/server");
const Logger = require("./util/Logger");
const Events = require("./structures/Events"); // イベントEmitterクラス
const { version } = require("./util/constants");
const ServerEvents = require("./util/Events"); // イベント名の列挙
const SBEWorld = require("./SBEWorld");
// const fetch = require("node-fetch"); // 削除

/**
 * SocketBEが WebSocket で行っていた処理を、ScriptBridgeServer で代用したクラス。
 */
const defaultOption = {
  timezone: "UTC",
  listUpdateInterval: 1000,
  packetTimeout: 200000,
  debug: false,
  commandVersion: 31,
  formatter: {},
  port: 8000, // ScriptBridgeで待ち受けるポート
};

class SBEServer {
  #worlds = new Map();
  #worldNumber = 0;

  constructor(option = {}) {
    // オプション統合
    this.option = { ...defaultOption, ...option };

    this.startTime = Date.now();
    this.logger = new Logger("Server", this.option);
    this.events = new Events(this);

    this.logger.info(
      `This server is running SocketBE-ScriptBridge version ${version}`
    );

    // ---- ScriptBridgeサーバ インスタンス起動 ----
    this.scriptBridge = new ScriptBridgeServer({ port: this.option.port });
    this.scriptBridge.start().then(() => {
      this.logger.info(`ScriptBridge listening on port ${this.option.port}`);
      this.events.emit(ServerEvents.ServerOpen);
    });

    // ScriptBridgeServer イベント: エラー
    this.scriptBridge.on("error", (e) => {
      this.events.emit(ServerEvents.Error, e);
    });

    // サーバが閉じた
    this.scriptBridge.on("serverClose", () => {
      this.events.emit(ServerEvents.ServerClose);
    });

    // クライアント接続 (Minecraft側) → 新しい World を作成
    this.scriptBridge.on("clientConnect", (session) => {
      const world = this.#createWorld(session);
      this.logger.info(`New session => ${world.name}`);
      this.events.emit(ServerEvents.WorldAdd, { world });
    });

    // クライアント切断
    this.scriptBridge.on("clientDisconnect", (session, reason) => {
      const world = this.#findWorldBySession(session);
      if (!world) return;

      this.#removeWorld(world);
      this.logger.info(`Disconnected => ${world.name}`);
    });

    // クライアント->サーバの "custom:packet" を受信
    this.scriptBridge.registerHandler("custom:packet", (action) => {
      const world = this.#findWorldBySession(action.session);
      if (!world) {
        return action.respond({ error: "World not found" });
      }
      // 受け取った packet データで SocketBE 相当の処理
      const packet = action.data;
      world._handlePacket(packet);

      // 必要あれば応答
      action.respond({ ok: true });
    });

    // 外部IPアドレスを取得して表示
    this.displayExternalIP();

    // 1秒間に20tickのループ (目安)
    setInterval(() => {
      this.events.emit(ServerEvents.Tick);
    }, 1000 / 20);

    this.logger.debug(
      `Server: Loaded (${(Date.now() - this.startTime) / 1000} s)`
    );
  }

  #createWorld(session) {
    const world = new SBEWorld(this, session, `World #${this.#worldNumber++}`);
    this.#worlds.set(world.id, world);
    return world;
  }

  #removeWorld(world) {
    world._stopInterval();
    this.#worlds.delete(world.id);
    this.events.emit(ServerEvents.WorldRemove, { world });
  }

  #findWorldBySession(session) {
    for (const w of this.#worlds.values()) {
      if (w.session === session) return w;
    }
    return null;
  }

  // -----------------------
  // 以下、もともとの SocketBE API
  // -----------------------

  getWorld(worldId) {
    return this.#worlds.get(worldId);
  }

  getWorlds() {
    return [...this.#worlds.values()];
  }

  /**
   * 全ワールドに command を投げる
   */
  runCommand(command) {
    const res = this.getWorlds().map((w) => w.runCommand(command));
    return Promise.all(res);
  }

  /**
   * 全ワールドにメッセージを送る
   */
  sendMessage(message, target) {
    const arr = this.getWorlds().map((w) => w.sendMessage(message, target));
    return Promise.all(arr);
  }

  /**
   * 全ワールド切断
   */
  disconnectAll() {
    this.getWorlds().forEach((w) => w.disconnect());
  }

  /**
   * 外部IPアドレスを取得してログに表示する
   */
  async displayExternalIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      this.logger.info(`External IP Address: ${data.ip}`);
    } catch (error) {
      this.logger.error("Failed to retrieve external IP address:", error);
    }
  }
}

module.exports = SBEServer;
