// src/util/Util.js
const { randomUUID } = require("node:crypto");
const moment = require("moment-timezone");

class Util {
  static isEmpty(v) {
    return v === undefined || v === null || v === "";
  }

  static getTime(timezone, mode) {
    const now = moment().tz(timezone || "UTC");
    switch (mode) {
      case "date":
        return now.format("MM/DD HH:mm:ss");
      case "year":
        return now.format("YYYY MM/DD HH:mm:ss");
      case "timestamp":
        return now.format();
      case undefined:
        return now.format("HH:mm:ss");
      default:
        return now.format(mode);
    }
  }

  /**
   * ScriptBridge向け "event" 用パケットビルダー (参考用)
   */
  static eventBuilder(eventName, eventPurpose = "subscribe") {
    return {
      header: {
        requestId: randomUUID(),
        messagePurpose: eventPurpose,
        version: 1,
        messageType: "commandRequest",
      },
      body: {
        eventName,
      },
    };
  }

  /**
   * コマンドパケット生成
   */
  static commandBuilder(cmd, commandVersion = 1) {
    return {
      header: {
        requestId: randomUUID(),
        messagePurpose: "commandRequest",
        version: 1,
        messageType: "commandRequest",
      },
      body: {
        origin: { type: "player" },
        commandLine: cmd,
        version: commandVersion,
      },
    };
  }

  static median(numbers) {
    if (!numbers.length) return 0;
    const half = (numbers.length / 2) | 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    if (sorted.length % 2) return sorted[half];
    return (sorted[half - 1] + sorted[half]) / 2;
  }

  static average(numbers) {
    if (!numbers.length) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

module.exports = Util;
