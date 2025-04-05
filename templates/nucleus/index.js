require("../../node_modules/@teeny-tiny/dotenv/index.js").config();
const fs = require("fs");
const { Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } = require("../../node_modules/discord.js/src/index.js");
const updateStatistics = require("./trackers/statistics.js");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] // --> remember to activate intents in developer portal settings too!
});

client.once("ready", () => {
  console.log("Ping Pong Bot is Online!");

  require("./trackers/status.js");
  client.user.setStatus(PresenceUpdateStatus[config?.status?.[0] || "Online"]);
  if (config?.status?.[1]) client.user.setActivity(config?.status?.[2], ((config?.status?.[1] === "Playing")) ? {} : {
    type: ActivityType[config?.status?.[1]]
  });
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring(process.env.PREFIX.length);

  if (!fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    const commandFile = require(`./commands/${commandName}.js`);
    commandFile.command(Object.entries(commandFile.variables).map((variable) => [
      variable,
      require("./config.json")?.variables?.commands?.[commandName]?.[variable] || null
    ]), client, message);
  };
});

client.on("guildCreate", () => updateStatistics(client));
client.on("guildMemberAdd", () => updateStatistics(client));

fs.readdirSync("./events").forEach((event) => {
  if (!event.endsWith(".js"))
  client.on(event.substring(0, event.length - 3), (...args) => {
    const eventFile = require(`./events/${event}`);
    eventFile.event(Object.entries(eventFile.variables).map((variable) => [
      variable,
      require("./config.json")?.variables?.events?.[commandName]?.[variable] || null
    ]), client, ...args);
  });
});

client.login(process.env.TOKEN);