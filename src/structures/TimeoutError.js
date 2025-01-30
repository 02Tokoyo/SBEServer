// src/structures/TimeoutError.js
class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

module.exports = TimeoutError;
