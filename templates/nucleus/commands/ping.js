const requireCore = (module) => require("../../../" + require("path").join(`node_modules/${module}`, JSON.parse(require("fs").readFileSync(`./node_modules/${module}/package.json`, "utf8") || "{}").main || "index.js").replaceAll("\\", "/"));
const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time",
  variables: {
    header: {
      title: "Header",
      description: "The header of the response embed",
      type: "text"
    }
  },
  slashCommand: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's response time"),
  command: async ({
    header,
    footer
  }, client, event) => {
    const start = Date.now();

    const sent = await ((commandType(event) === "message") ? event.channel.send("Pinging...") : event.reply("Pinging..."));

    const end = Date.now();

    const latency = (commandType(event)  === "message") ? (sent.createdTimestamp - event.createdTimestamp) : (end - start);
    const apiLatency = (client.ws.ping >= 0) ? Math.round(client.ws.ping) : "N/A";

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(header || "🏓  Pong!")
      .addFields(
        { name: "Bot Latency", value: `${latency}ms`, inline: true },
        { name: "API Latency", value: `${apiLatency}ms`, inline: true }
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    await sent.edit({ content: null, embeds: [embed] });
  }
};