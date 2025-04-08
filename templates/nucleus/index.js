require("../../node_modules/@teeny-tiny/dotenv/index.js").config();
const fs = require("fs");
const { Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } = require("../../node_modules/discord.js/src/index.js");
const updateStatistics = require("./trackers/statistics.js");
let config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ], // --> remember to activate intents in developer portal settings too!
  rest: {
    requestTimeout: JSON.parse(fs.readFileSync("../../settings.json", "utf8") || "{}").apiTimeout || 5000
  }
});

client.once("ready", () => {
  console.log("Bot is Online!");

  require("./trackers/status.js");
  updateStatistics(client);
  client.user.setStatus(PresenceUpdateStatus[config?.status?.[0] || "Online"]);
  if (config?.status?.[1]) client.user.setActivity(config?.status?.[2], ((config?.status?.[1] === "Playing")) ? {} : {
    type: ActivityType[config?.status?.[1]]
  });

  fs.watch("./config.json", (eventType) => {
    if ((eventType !== "change") || (JSON.stringify(config.status) === JSON.stringify(JSON.parse(fs.readFileSync("./config.json", "utf8")).status))) return;

    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

    client.user.setStatus(PresenceUpdateStatus[config?.status?.[0] || "Online"]);
    if (config?.status?.[1]) client.user.setActivity(config?.status?.[2], ((config?.status?.[1] === "Playing")) ? {} : {
      type: ActivityType[config?.status?.[1]]
    });
  });
});

client.on("messageCreate", (message) => {
  if (message.author.bot || !message.content.startsWith(process.env.PREFIX)) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring(process.env.PREFIX.length);

  if (fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

    const commandFile = require(`./commands/${commandName}.js`);
    commandFile.command({
      ...{
        footer: config.footer
      },
      ...Object.entries(commandFile.variables).map(([variableName]) => [
        variableName,
        config?.variables?.commands?.[commandName]?.[variableName] || null
      ]).reduce((accumulator, [variableName, variableValue]) => ({
        ...accumulator,
        ...{
          [variableName]: variableValue
        }
      }), {})
    }, client, message);
  };
});

client.on("guildCreate", () => updateStatistics(client));
client.on("guildMemberAdd", () => updateStatistics(client));

fs.readdirSync("./events").forEach((event) => {
  if (!event.endsWith(".js"))
  client.on(event.substring(0, event.length - 3), (...args) => {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

    const eventFile = require(`./events/${event}`);
    eventFile.event({
      ...{
        footer: config.footer
      },
      ...Object.entries(eventFile.variables).map(([variableName]) => [
        variableName,
        config?.variables?.events?.[event]?.[variableName] || null
      ]).reduce((accumulator, [variableName, variableValue]) => ({
        ...accumulator,
        ...{
          [variableName]: variableValue
        }
      }), {})
    }, client, ...args);
  });
});

client.login(process.env.TOKEN);