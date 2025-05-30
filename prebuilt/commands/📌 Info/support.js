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
    errorMessage: {
      type: "text",
      title: "Error Message",
      description: "The message to send if the invite link is not set",
      default: "Please set the invite link in the bot's settings."
    },
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
      default: "🎉  Join My Support Server!"
    },
    invite: {
      type: "link",
      title: "Support Server Invite Link",
      description: "The invite link of the bot's support server",
      default: ""
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the response embed",
      default: "Click the link above to join my support server!"
    }
  },

  command: async ({
    errorMessage,
    content,
    title,
    invite,
    description,
    footer
  }, client, event) => {
    if (!invite) return event.respond({ content: errorMessage, ephemeral: (commandType(event) === "interaction") });

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