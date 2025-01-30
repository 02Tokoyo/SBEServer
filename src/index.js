// index.js
// ライブラリのエントリーポイント。exportしたいクラスなどをまとめる

const SBEServer = require("./SBEServer");
const SBEWorld = require("./SBEWorld");
const Logger = require("./util/Logger");
const Events = require("./util/Events");
const ScoreboardManager = require("./managers/ScoreboardManager");
const ScoreboardObjective = require("./structures/ScoreboardObjective");
const TimeoutError = require("./structures/TimeoutError");
const EventsStruct = require("./structures/Events"); // 通常の Eventクラス

module.exports = {
  SBEServer,
  SBEWorld,
  Logger,
  Events,
  ScoreboardManager,
  ScoreboardObjective,
  TimeoutError,
  EventsStruct,
};
