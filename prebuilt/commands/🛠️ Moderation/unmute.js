if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Unmute a user in the server.",

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
      default: "🔊 User Unmuted"
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
      default: "❌ You must specify a user to unmute."
    },

    errorCannotUnmute: {
      type: "textarea",
      title: "Error: Cannot Unmute User",
      description: "Message if the bot cannot unmute the user (permissions/role).",
      default: "❌ I cannot unmute this user due to role hierarchy or permissions."
    },

    errorSelfUnmute: {
      type: "textarea",
      title: "Error: Trying to Unmute Yourself",
      description: "Message if user tries to unmute themselves.",
      default: "❌ You cannot unmute yourself."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorNoUser,
    errorCannotUnmute,
    errorSelfUnmute
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let targetMember;

    if (commandType(event) === "message") {
      targetMember = event.mentions.members?.first();
    } else {
      targetMember = event.options.getMember("user");
    };

    if (!targetMember) return event.reject(errorNoUser);
    if (targetMember.id === ((commandType(event) === "message") ? event.author.id : event.user.id)) return event.reject(errorSelfUnmute);
    if (!targetMember.moderatable) return event.reject(errorCannotUnmute);

    try {
      await targetMember.timeout(null);

      const embed = new EmbedBuilder()
        .setColor(0x00cc66)
        .setTitle(title || null)
        .setDescription(description || `**${targetMember.user.tag}** has been unmuted.`)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to unmute user: ${err.message}`);
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("unmute")
      .setDescription("Unmute a user in the server")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to unmute")
          .setRequired(true)
      )
  ) : null
};