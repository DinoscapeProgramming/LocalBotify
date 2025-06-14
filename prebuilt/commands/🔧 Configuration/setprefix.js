if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const fs = require("fs");

module.exports = {
  description: "Sets the bot's prefix for the server.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    title: {
      type: "textarea",
      title: "Embed Title",
      description: "The title of the response embed",
      default: "✏️  Set Prefix"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the response embed. Use {prefix} to show the current prefix.",
      default: "The prefix has been set to `{prefix}`"
    },

    missingPermissions: {
      type: "textarea",
      title: "Missing Permissions Message",
      description: "Message shown if the user lacks the required permissions.",
      default: "🚫 You need the **Manage Server** permission to use this command."
    },

    missingPrefix: {
      type: "textarea",
      title: "Missing Prefix Message",
      description: "Message shown if the user doesn't provide a prefix to set.",
      default: "❌ Please provide a prefix to set."
    }
  },

  command: async ({
    title,
    description,
    footer,
    missingPermissions,
    missingPrefix
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);
    if ((commandType(event) === "message") && !event.content.split(" ").slice(1).join(" ")) return event.reject(missingPrefix);

    if (((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("prefix")) !== JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}").prefix) {
      event.store.prefix = (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("prefix");
    } else {
      delete event.store.prefix;
    };

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(description.replaceAll("{prefix}", (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("prefix")) || null)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("prefix")
          .setDescription("The prefix to set for the server.")
          .setRequired(true)
      )
  ) : null
};