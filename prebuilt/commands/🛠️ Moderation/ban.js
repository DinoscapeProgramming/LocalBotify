if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Ban a user from the server with an optional reason.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "BAN_MEMBERS"
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
      default: "🚫 User Banned"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Additional description shown in the embed.",
      default: ""
    },

    footer: {
      type: "textarea",
      title: "Footer Text",
      description: "Footer text for the embed.",
      default: "Ban executed"
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
      default: "❌ You must specify a user to ban."
    },

    errorCannotBan: {
      type: "textarea",
      title: "Error: Cannot Ban User",
      description: "Message if the bot cannot ban the user (permissions/role).",
      default: "❌ I cannot ban this user due to role hierarchy or permissions."
    },

    errorSelfBan: {
      type: "textarea",
      title: "Error: Trying to Ban Yourself",
      description: "Message if user tries to ban themselves.",
      default: "❌ You cannot ban yourself."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorNoUser,
    errorCannotBan,
    errorSelfBan
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let targetMember, reason;

    if (commandType(event) === "message") {
      targetMember = event.mentions.members?.first();
      reason = event.content.split(" ").slice(2).join(" ") || "No reason provided";
    } else {
      targetMember = event.options.getMember("user");
      reason = event.options.getString("reason") || "No reason provided";
    };

    if (!targetMember) return event.reject(errorNoUser);

    if (targetMember.id === ((commandType(event) === "message") ? event.author.id : event.user.id)) return event.reject(errorSelfBan);

    if (!targetMember.bannable) return event.reject(errorCannotBan);

    try {
      await targetMember.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(title || null)
        .setDescription(description || `**${targetMember.user.tag}** has been banned.\nReason: ${reason}`)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to ban user: ${err.message}`);
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban a user from the server")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to ban")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for ban")
          .setRequired(false)
      )
  ) : null
};