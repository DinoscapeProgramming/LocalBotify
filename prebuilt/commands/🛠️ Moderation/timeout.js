if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder, time } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const ms = requireCore("ms");

module.exports = {
  description: "Timeout a user for a specified duration.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "MODERATE_MEMBERS"
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
      default: "⏱️ User Timed Out"
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

    errorNoUser: {
      type: "textarea",
      title: "Error: No User Specified",
      description: "Message if no user is specified.",
      default: "❌ You must specify a user to timeout."
    },

    errorCannotTimeout: {
      type: "textarea",
      title: "Error: Cannot Timeout User",
      description: "Message if the bot cannot timeout the user (permissions/role).",
      default: "❌ I cannot timeout this user due to role hierarchy or permissions."
    },

    errorSelfTimeout: {
      type: "textarea",
      title: "Error: Trying to Timeout Yourself",
      description: "Message if user tries to timeout themselves.",
      default: "❌ You cannot timeout yourself."
    },

    errorInvalidDuration: {
      type: "textarea",
      title: "Error: Invalid Duration",
      description: "Message if duration is invalid or not supported.",
      default: "❌ Invalid duration. Use formats like `1m`, `5h`, `2d`, etc."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorNoUser,
    errorCannotTimeout,
    errorSelfTimeout,
    errorInvalidDuration
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let targetMember, durationArg, reason;

    if (commandType(event) === "message") {
      const args = event.content.split(" ").slice(1);
      targetMember = event.mentions.members?.first();
      durationArg = args[1];
      reason = args.slice(2).join(" ") || "No reason provided";
    } else {
      targetMember = event.options.getMember("user");
      durationArg = event.options.getString("duration");
      reason = event.options.getString("reason") || "No reason provided";
    }

    if (!targetMember) return event.reject(errorNoUser);
    if (targetMember.id === ((commandType(event) === "message") ? event.author.id : event.user.id)) return event.reject(errorSelfTimeout);
    if (!targetMember.moderatable) return event.reject(errorCannotTimeout);

    const duration = ms(durationArg);
    if (!duration || duration > 28 * 24 * 60 * 60 * 1000) return event.reject(errorInvalidDuration); // Discord max: 28 days

    try {
      await targetMember.timeout(duration, reason);

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(title || null)
        .setDescription(description || `**${targetMember.user.tag}** has been timed out for **${durationArg}**.\nReason: ${reason}`)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to timeout user: ${err.message}`);
    }
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("Timeout a user from interacting for a set duration")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to timeout")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("duration")
          .setDescription("Duration (e.g. 5m, 2h, 1d)")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for the timeout")
          .setRequired(false)
      )
  ) : null
};