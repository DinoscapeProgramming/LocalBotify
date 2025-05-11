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
      title: "Invite Link",
      description: "The invite link of the bot",
      type: "link"
    }
  },
  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .setName("invite")) : null,
  command: async ({
    invite,
    header,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(header || "🎉  Invite Me!")
      .setDescription("Click the link above to invite me to your server!")
      .setURL(invite || fs.readFileSync("./channels/invite.txt", "utf8") || "")
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  }
};