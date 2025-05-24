if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

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
    const start = Date.now();

    const sent = await event.respond("Pinging...");

    const end = Date.now();

    const latency = (commandType(event)  === "message") ? (sent.createdTimestamp - event.createdTimestamp) : (end - start);
    const apiLatency = (client.ws.ping >= 0) ? Math.round(client.ws.ping) : "N/A";

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(header || "🏓  Pong!")
      .addFields(
        {
          name: "Bot Latency",
          value: `${latency}ms`,
          inline: true
        },
        {
          name: "API Latency",
          value: `${apiLatency}ms`,
          inline: true
        }
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    await sent.edit({ content: null, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .setName("ping")) : null
};