if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time.",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the embed.",
      default: ""
    },

    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed",
      default: "🏓  Pong!"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed.",
      default: null
    },

    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: true
    },

    botLatencyName: {
      type: "text",
      title: "Bot Latency Field",
      description: "The name of the field that will display the bot's latency.",
      default: "🤖  Bot Latency"
    },

    botLatencyValue: {
      type: "text",
      title: "Bot Latency Value",
      description: "The value of the field that will display the bot's latency.",
      default: "${botLatency}ms"
    },

    apiLatencyName: {
      type: "text",
      title: "API Latency Field",
      description: "The name of the field that will display the API latency.",
      default: "🌐  API Latency"
    },

    apiLatencyValue: {
      type: "text",
      title: "API Latency Value",
      description: "The value of the field that will display the API latency.",
      default: "${apiLatency}ms"
    }
  },

  command: async ({
    content,
    title,
    description,
    inline,
    botLatencyName,
    botLatencyValue,
    apiLatencyName,
    apiLatencyValue,
    footer
  }, client, event) => {
    const start = Date.now();

    const sent = await event.respond("Pinging...");

    const end = Date.now();

    const botLatency = (commandType(event)  === "message") ? (sent.createdTimestamp - event.createdTimestamp) : (end - start);
    const apiLatency = (client.ws.ping >= 0) ? Math.round(client.ws.ping) : "N/A";

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title)
      .setDescription(description || null)
      .addFields(
        {
          name: botLatencyName,
          value: botLatencyValue.replaceAll("${botLatency}", botLatency),
          inline
        },
        {
          name: apiLatencyName,
          value: apiLatencyValue.replaceAll("${apiLatency}", apiLatency),
          inline
        }
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    await sent.edit({ content, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};