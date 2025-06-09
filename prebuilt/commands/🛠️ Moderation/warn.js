if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Warn a user with an optional reason and save the warning in server storage.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
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
      default: "⚠️  User Warned"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Additional description shown in the embed. Use {user} and {count} placeholders.",
      default: "**{user}** has been warned.\nThey now have **{count}** warning(s).\nReason: {reason}"
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
      default: "❌ You must specify a user to warn."
    },

    errorSelfWarn: {
      type: "textarea",
      title: "Error: Trying to Warn Yourself",
      description: "Message if user tries to warn themselves.",
      default: "❌ You cannot warn yourself."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorNoUser,
    errorSelfWarn
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
    if (targetMember.id === ((commandType(event) === "message") ? event.author.id : event.user.id)) return event.reject(errorSelfWarn);

    if (!event.store.warnings) (event.store.warnings = {});

    const userId = targetMember.id;
    if (!event.store.warnings[userId]) (event.store.warnings[userId] = []);

    event.store.warnings[userId].push({
      reason,
      date: new Date().toISOString(),
      moderator: (commandType(event) === "message") ? event.author.id : event.user.id
    });

    const warnCount = event.store.warnings[userId].length;

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle(title || null)
      .setDescription(
        (description || "")
          .replaceAll("{user}", targetMember.user.tag)
          .replaceAll("{count}", warnCount.toString())
          .replaceAll("{reason}", reason)
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("warn")
      .setDescription("Warn a user with an optional reason")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to warn")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for warning")
          .setRequired(false)
      )
  ) : null
};