const { EmbedBuilder } = require("discord.js");
const { commandType } = require("localbotify");

module.exports = {
  variables: {
    header: {
      title: "Header",
      description: "The header of the response embed",
      type: "text"
    }
  },
  command: async ({
    header,
    footer
  }, client, event) => {
    if (event.content.trim().toLowerCase() === "!ping") {
      const sent = await ((commandType(event) === "message") ? event.channel.send : event.reply)("Pinging...");
      const latency = sent.createdTimestamp - event.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping); 

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(header || "🏓 Pong!")
        .addFields(
          { name: "Bot Latency", value: `${latency}ms`, inline: true },
          { name: "API Latency", value: `${apiLatency}ms`, inline: true }
        )
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      await sent.edit({ content: null, embeds: [embed] });
    };
  }
};