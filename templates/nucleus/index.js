require("../../node_modules/@teeny-tiny/dotenv/index.js").config();
const fs = require("fs");
const { Client, GatewayIntentBits } = require("../../node_modules/discord.js/src/index.js");
const updateStatistics = require("./trackers/statistics.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] // --> remember to activate intents in developer portal settings too!
});

client.once("ready", () => {
  require("./trackers/status.js");
  console.log("Ping Pong Bot is Online!");
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring(process.env.PREFIX.length);

  if (!fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    require(`./commands/${commandName}.js`)(client, message);
  };
});

client.on("guildCreate", () => updateStatistics(client));
client.on("guildMemberAdd", () => updateStatistics(client));

client.login(process.env.TOKEN);