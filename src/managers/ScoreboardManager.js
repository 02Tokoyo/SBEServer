// src/managers/ScoreboardManager.js
const ScoreboardObjective = require("../structures/ScoreboardObjective");

class ScoreboardManager {
  #world;

  constructor(world) {
    this.#world = world;
    this.#world.logger.debug("ScoreboardManager: Initialized");
  }

  get world() {
    return this.#world;
  }

  async getObjectives() {
    const res = await this.#world.runCommand("scoreboard objectives list");
    const objectives = res.statusMessage
      .split("\n")
      .slice(1)
      .map((entry) => {
        const match = [...entry.matchAll(/- (.*):.*?'(.*?)'.*/g)][0];
        if (!match) return null;
        const [, id, displayName] = match;
        return new ScoreboardObjective(this.#world, id, displayName);
      })
      .filter(Boolean);
    return objectives;
  }

  async getObjective(objectiveId) {
    const res = await this.getObjectives();
    return res.find((obj) => obj.id === objectiveId);
  }

  async addObjective(objectiveId, displayName = "") {
    if (await this.getObjective(objectiveId)) return null;
    const res = await this.#world.runCommand(
      `scoreboard objectives add "${objectiveId}" dummy "${displayName}"`
    );
    if (res.statusCode !== 0) return null;
    return new ScoreboardObjective(this.#world, objectiveId, displayName);
  }

  async removeObjective(objectiveId) {
    const objId = ScoreboardManager.resolveObjective(objectiveId);
    if (!(await this.getObjective(objId))) return false;
    const res = await this.#world.runCommand(
      `scoreboard objectives remove ${objId}`
    );
    return res.statusCode === 0;
  }

  async getScores(player) {
    const res = await this.#world.runCommand(
      `scoreboard players list "${player}"`
    );
    try {
      return Object.fromEntries(
        [...res.statusMessage.matchAll(/: (-*\d*) \((.*?)\)/g)].map((data) => [
          data[2],
          Number(data[1]),
        ])
      );
    } catch {
      return {};
    }
  }

  async getScore(player, objectiveId) {
    const objId = ScoreboardManager.resolveObjective(objectiveId);
    const scores = await this.getScores(player);
    return scores[objId] ?? null;
  }

  async setScore(player, objectiveId, score) {
    const objId = ScoreboardManager.resolveObjective(objectiveId);
    const res = await this.#world.runCommand(
      `scoreboard players set "${player}" "${objId}" ${score}`
    );
    return res.statusCode === 0 ? score : null;
  }

  async addScore(player, objectiveId, amount) {
    const oldVal = await this.getScore(player, objectiveId);
    if (oldVal == null) return null;
    const newVal = oldVal + amount;
    return await this.setScore(player, objectiveId, newVal);
  }

  async removeScore(player, objectiveId, amount) {
    const oldVal = await this.getScore(player, objectiveId);
    if (oldVal == null) return null;
    const newVal = oldVal - amount;
    return await this.setScore(player, objectiveId, newVal);
  }

  async resetScore(player, objectiveId = "") {
    const objId = ScoreboardManager.resolveObjective(objectiveId);
    const res = await this.#world.runCommand(
      `scoreboard players reset "${player}" "${objId}"`
    );
    return res.statusCode === 0;
  }

  async setDisplay(displaySlotId, objectiveId, sortOrder) {
    let cmd = `scoreboard objectives setdisplay ${displaySlotId}`;
    if (objectiveId) {
      cmd += ` "${ScoreboardManager.resolveObjective(objectiveId)}"`;
    }
    if (sortOrder) {
      cmd += ` ${sortOrder}`;
    }
    const res = await this.#world.runCommand(cmd);
    return res.statusCode === 0;
  }

  static resolveObjective(objective) {
    return typeof objective === "string" ? objective : objective.id;
  }
}

module.exports = ScoreboardManager;
