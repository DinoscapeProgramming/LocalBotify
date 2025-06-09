if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Delete a specified number of messages from the channel.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "MANAGE_MESSAGES"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "Text above the embed response.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed.",
      default: "🧹  Messages Cleared"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Additional description shown in the embed.",
      default: ""
    },

    missingPermissions: {
      type: "textarea",
      title: "Missing Permissions Message",
      description: "Message shown if the user lacks the required permissions.",
      default: "🚫 You need the **Manage Server** permission to use this command."
    },

    errorInvalidAmount: {
      type: "textarea",
      title: "Error: Invalid Amount",
      description: "Message if the amount is not a number or out of range.",
      default: "❌ Please specify a valid number between 1 and 100."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorInvalidAmount
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let amount;

    if (commandType(event) === "message") {
      amount = parseInt(event.content.split(" ")[1]);
    } else {
      amount = event.options.getInteger("amount");
    };

    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return event.reject(errorInvalidAmount);
    };

    try {
      const deleted = await event.channel.bulkDelete(amount, true);

      const author = (commandType(event) === "message") ? event.author : event.user;

      const embed = new EmbedBuilder()
        .setColor(0x7289da)
        .setTitle(title || null)
        .setDescription(description || `🗑️ Successfully deleted **${deleted.size}** messages.`)
        .setFooter({ text: footer, iconURL: author.displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to delete messages: ${err.message}`);
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("clear")
      .setDescription("Delete a number of messages from the channel")
      .addIntegerOption(option =>
        option.setName("amount")
          .setDescription("Number of messages to delete (1–100)")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  ) : null
};