require("@teeny-tiny/dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] // --> activate intents in developer portal settings too!
});

client.once("ready", () => {
  console.log("Ping Pong Bot is Online!");
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring(process.env.PREFIX.length);

  if (!fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    require(`./commands/${commandName}.js`)(Client, message);
  };
});

client.login(process.env.TOKEN);