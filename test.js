// test.js
const { SBEServer } = require("./src");
const reader = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const server = new SBEServer({
  port: 8000,
  timezone: "Asia/Tokyo",
  debug: true,
});

server.events.on("serverOpen", () => {
  server.logger.log("Server open on port 8000");
});

server.events.on("worldAdd", (ev) => {
  const { world } = ev;
  server.logger.info(`connection opened: ${world.name}`);
  world.sendMessage("Hello from ScriptBridge! (SocketBE style)");
});

server.events.on("worldRemove", (ev) => {
  const { world } = ev;
  server.logger.info(`connection closed: ${world.name}`);
});

server.events.on("playerJoin", (ev) => {
  const { players } = ev;
  server.logger.info(`Joined: ${players.join(", ")}`);
});

server.events.on("playerLeave", (ev) => {
  const { players } = ev;
  server.logger.info(`Left: ${players.join(", ")}`);
});

server.events.on("playerChat", async (ev) => {
  const { sender, message, world } = ev;
  if (sender === "外部") return;

  world.logger.info(`<${sender}> ${message}`);
  // 送られたメッセージをそのまま全員に返す
  world.sendMessage(message);
});

server.events.on("error", (e) => {
  server.logger.error(e);
});

// コンソール入力
reader.on("line", async (line) => {
  if (line.startsWith("/")) {
    // /help などはserver.runCommandで一斉に実行
    const res = await server.runCommand(line.slice(1));
    console.log(res);
  } else {
    try {
      const r = eval(line);
      console.log(r);
    } catch (e) {
      console.error("EvalError:", e);
    }
  }
});

process.on("unhandledRejection", (err) => {
  server.logger.error(err);
});
