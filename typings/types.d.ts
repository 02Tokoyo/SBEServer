export interface ServerPacket {
  header: {
    requestId: string,
    messagePurpose: string,
    version: number,
    messageType: string,
    eventName?: string
  },
  body: {
    eventName?: string
  } | any
}

export interface PlayerList {
  current: number,
  max: number,
  players: string[]
}

export interface PlayerDetail extends PlayerList {
  details: PlayerInfo[]
}

export interface PlayerInfo {
  activeSessionId: string,
  clientId: string,
  color: string,
  deviceSessionId: string,
  globalMultiplayerCorrelationId: string,
  id: number,
  name: string,
  randomId: number,
  uuid: string
}

export type VersionResolvable = string | number | number[];

export interface ServerOption extends WebSocket.ServerOptions {
  debug?: boolean;
  timezone?: string;
  packetTimeout?: number;
  listUpdateInterval?: number;
  /**
   * The version used for requesting commands. More info in Bedrock OSS(link)
   * @example "1.19.70" or [ 1, 19, 70 ] or 31 (internal value)
   * @link https://discord.com/channels/494194063730278411/1075339534797119548/1076028491616768062
   */
  commandVersion?: VersionResolvable;
}

export interface LoggerOption {
  debug?: boolean;
  timezone?: string;
}

export interface ServerEvents {
  [Events.PlayerJoin]:  { players: string[], world: World },
  [Events.PlayerLeave]: { players: string[], world: World }
  [Events.ServerOpen]: void,
  [Events.ServerClose]: void,
  [Events.WorldAdd]: { world: World },
  [Events.WorldRemove]: { world: World },
  [Events.PacketReceive]: { packet: any, world: World },
  [Events.Error]: Error,
  [Events.PlayerChat]: {
    'type': 'chat' | 'say' | 'me' | 'tell',
    message: string,
    sender: string,
    receiver: string,
    world: World
  },
  [Events.PlayerTitle]: {
    'type': 'title',
    message: string,
    sender: string,
    receiver: string,
    world: World
  },
  [Events.Tick]: void
}

import World = require("./structures/World");
import Events = require("./util/Events");
import WebSocket from 'ws';