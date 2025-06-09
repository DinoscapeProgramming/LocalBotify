if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Unlock a text channel for everyone.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "MANAGE_CHANNELS"
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
      default: "🔓 Channel Unlocked"
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

    errorCannotUnlock: {
      type: "textarea",
      title: "Error: Cannot Unlock Channel",
      description: "Message if the bot cannot modify the channel permissions.",
      default: "❌ I cannot unlock this channel due to permissions."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorCannotUnlock
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    const channel = event.channel;

    try {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: true
      });

      const embed = new EmbedBuilder()
        .setColor(0x00cc66)
        .setTitle(title || null)
        .setDescription(description || `🔓 This channel has been unlocked for everyone.`)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`${errorCannotUnlock}\n\`\`\`${err.message}\`\`\``);
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("Unlock the current text channel for everyone")
  ) : null
};