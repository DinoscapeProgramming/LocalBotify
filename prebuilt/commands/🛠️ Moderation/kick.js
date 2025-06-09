if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Kick a user from the server with an optional reason.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "KICK_MEMBERS"
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
      default: "👢  User Kicked"
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
      default: "❌ You must specify a user to kick."
    },

    errorCannotKick: {
      type: "textarea",
      title: "Error: Cannot Kick User",
      description: "Message if the bot cannot kick the user (permissions/role).",
      default: "❌ I cannot kick this user due to role hierarchy or permissions."
    },

    errorSelfKick: {
      type: "textarea",
      title: "Error: Trying to Kick Yourself",
      description: "Message if user tries to kick themselves.",
      default: "❌ You cannot kick yourself."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorNoUser,
    errorCannotKick,
    errorSelfKick
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

    const author = (commandType(event) === "message") ? event.author : event.user;

    if (targetMember.id === author.id) return event.reject(errorSelfKick);

    if (!targetMember.kickable) return event.reject(errorCannotKick);

    try {
      await targetMember.kick(reason);

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(title || null)
        .setDescription(description || `**${targetMember.user.tag}** has been kicked.\nReason: ${reason}`)
        .setFooter({ text: footer, iconURL: author.displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to kick user: ${err.message}`);
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a user from the server")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to kick")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for kick")
          .setRequired(false)
      )
  ) : null
};