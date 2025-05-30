if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const fs = require("fs");
const path = require("path");

module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the response embed",
      default: ""
    },
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed",
      default: "🎉  Invite Me!"
    },
    invite: {
      type: "link",
      title: "Invite Link",
      description: "The invite link of the bot",
      default: (global.isLocalBotify) ? fs.readFileSync("./channels/invite.txt", "utf8") : fs.readFileSync(path.join(path.dirname(__dirname), "channels/invite.txt"), "utf8") || ""
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the response embed",
      default: "Click the link above to invite me to your server!"
    }
  },

  command: async ({
    content,
    title,
    invite,
    description,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title)
      .setURL(invite)
      .setDescription(description)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};