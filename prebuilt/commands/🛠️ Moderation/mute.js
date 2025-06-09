if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Mute a user in the server for a specified time and reason.",

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
      default: "🔇 User Muted"
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
      description: "Message if no user is specified in command.",
      default: "❌ You must specify a user to mute."
    },

    errorCannotMute: {
      type: "textarea",
      title: "Error: Cannot Mute User",
      description: "Message if the bot cannot mute the user (permissions/role).",
      default: "❌ I cannot mute this user due to role hierarchy or permissions."
    },

    errorSelfMute: {
      type: "textarea",
      title: "Error: Trying to Mute Yourself",
      description: "Message if user tries to mute themselves.",
      default: "❌ You cannot mute yourself."
    },

    errorInvalidTime: {
      type: "textarea",
      title: "Error: Invalid Time Format",
      description: "Message if the time format is invalid.",
      default: "❌ Please provide a valid mute duration (e.g., 10m, 1h, 2d)."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorNoUser,
    errorCannotMute,
    errorSelfMute,
    errorInvalidTime
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let targetMember, duration, reason;

    if (commandType(event) === "message") {
      const args = event.content.split(" ").slice(1);
      targetMember = event.mentions.members?.first();
      duration = args[1];
      reason = args.slice(2).join(" ") || "No reason provided";
    } else {
      targetMember = event.options.getMember("user");
      duration = event.options.getString("duration");
      reason = event.options.getString("reason") || "No reason provided";
    };

    if (!targetMember) return event.reject(errorNoUser);
    if (targetMember.id === ((commandType(event) === "message") ? event.author.id : event.user.id)) return event.reject(errorSelfMute);
    if (!targetMember.moderatable) return event.reject(errorCannotMute);

    const parseDuration = (str) => {
      const match = str.match(/^(\d+)(s|m|h|d)$/);
      if (!match) return null;
      const [, value, unit] = match;
      const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      return parseInt(value) * multipliers[unit];
    };

    const ms = parseDuration(duration);
    if (!ms) return event.reject(errorInvalidTime);

    try {
      await targetMember.timeout(ms, reason);

      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle(title || null)
        .setDescription(description || `**${targetMember.user.tag}** has been muted for ${duration}.\nReason: ${reason}`)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to mute user: ${err.message}`);
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("mute")
      .setDescription("Mute a user in the server")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to mute")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("duration")
          .setDescription("Mute duration (e.g., 10m, 1h, 2d)")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for mute")
          .setRequired(false)
      )
  ) : null
};