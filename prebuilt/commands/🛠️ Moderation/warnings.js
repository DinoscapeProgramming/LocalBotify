if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "View the warnings of a user.",

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
      default: "⚠️  User Warnings"
    },

    noWarningsMessage: {
      type: "textarea",
      title: "No Warnings Message",
      description: "Message shown if the user has no warnings.",
      default: "**{user}** has no warnings."
    },

    footer: {
      type: "textarea",
      title: "Footer Text",
      description: "Footer text for the embed.",
      default: "Warnings command executed"
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
      default: "❌ You must specify a user to view warnings."
    }
  },

  command: async ({
    content,
    title,
    noWarningsMessage,
    footer,
    missingPermissions,
    errorNoUser
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let targetMember;

    if (commandType(event) === "message") {
      targetMember = event.mentions.members?.first();
    } else {
      targetMember = event.options.getMember("user");
    };

    if (!targetMember) return event.reject(errorNoUser);

    const userId = targetMember.id;
    const warnings = event.store.warnings?.[userId] || [];

    if (!warnings.length) return event.respond({
      content: noWarningsMessage.replaceAll("{user}", targetMember.user.tag),
      embeds: []
    });

    const warnList = warnings
      .map((w, i) => `**${i + 1}.** ${w.reason} (at <t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>)`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle(title || null)
      .setDescription(warnList)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("warnings")
      .setDescription("View warnings of a user")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to view warnings of")
          .setRequired(true)
      )
  ) : null
};