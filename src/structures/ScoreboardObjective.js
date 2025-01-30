// src/structures/ScoreboardObjective.js

class ScoreboardObjective {
  #world;
  #id;
  #displayName;

  constructor(world, objectiveId, displayName = "") {
    this.#world = world;
    this.#id = objectiveId;
    this.#displayName = displayName;
  }

  get world() {
    return this.#world;
  }
  get id() {
    return this.#id;
  }
  get displayName() {
    return this.#displayName;
  }

  async getScore(player) {
    return await this.world.scoreboards.getScore(player, this.id);
  }

  async setScore(player, score) {
    return await this.world.scoreboards.setScore(player, this.id, score);
  }

  async addScore(player, score) {
    return await this.world.scoreboards.addScore(player, this.id, score);
  }

  async removeScore(player, score) {
    return await this.world.scoreboards.removeScore(player, this.id, score);
  }

  async resetScore(player) {
    return await this.world.scoreboards.resetScore(player, this.id);
  }

  toJSON() {
    return { id: this.id, displayName: this.displayName };
  }
}

module.exports = ScoreboardObjective;
