// src/structures/Events.js
const { EventEmitter } = require("events");

/**
 * SocketBE のイベントEmitterラッパ
 */
class Events {
  constructor(server) {
    this.server = server;
    this._events = new EventEmitter();
    this._subscribed = new Set();

    this.server.logger.debug("ServerEvent: Initialized");
  }

  on(eventName, fn) {
    this._subscribed.add(eventName);
    this._events.on(eventName, fn);
    return fn;
  }

  off(eventName, fn) {
    this._subscribed.delete(eventName);
    this._events.off(eventName, fn);
  }

  emit(eventName, eventData) {
    return this._events.emit(eventName, eventData);
  }
}

module.exports = Events;
