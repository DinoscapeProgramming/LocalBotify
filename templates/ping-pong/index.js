require("@teeny-tiny/dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.once("ready", () => {
    console.log("Ping Pong Bot is Online!");
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === "ping") {
        message.channel.send("Pong!");
    }
});

client.login(process.env.TOKEN);