if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const fs = require("fs");

module.exports = {
  description: "Check the bot's response time",
  variables: {
    header: {
      title: "Header",
      description: "The header of the response embed",
      type: "text"
    },
    invite: {
      title: "Developer ID",
      description: "The id of the bot developer",
      type: "number"
    }
  },
  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .setName("botinfo")) : null,
  command: async ({
    invite,
    header,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle('Bot Information') // Title of the embed
      .setThumbnail(client.user.avatarURL()) // Set the bot's avatar as the thumbnail
      .addFields(
        { name: 'Bot Name', value: client.user.username, inline: true },
        { name: 'Bot ID', value: client.user.id, inline: true },
        { name: 'Creation Date', value: new Date(client.user.createdAt).toLocaleDateString(), inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }, // Number of servers the bot is in
        { name: 'Ping', value: `${client.ws.ping}ms`, inline: true }, // Bot's ping in ms
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  }
};