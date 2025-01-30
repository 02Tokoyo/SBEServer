// src/util/Events.js
/**
 * SocketBE 内部で使うイベント名を定義 (定数オブジェクト)
 */
const Events = {
  ServerOpen: "serverOpen",
  ServerClose: "serverClose",
  WorldAdd: "worldAdd",
  WorldRemove: "worldRemove",
  PlayerJoin: "playerJoin",
  PlayerLeave: "playerLeave",
  PacketSend: "packetSend",
  PacketReceive: "packetReceive",
  Error: "error",
  PlayerChat: "playerChat",
  PlayerTitle: "playerTitle",
  Tick: "tick",
};

module.exports = Events;
