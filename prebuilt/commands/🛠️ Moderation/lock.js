if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Lock the current channel to prevent members from sending messages.",

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
      default: "🔒 Channel Locked"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Additional description shown in the embed.",
      default: "This channel has been locked. Members can no longer send messages."
    },

    missingPermissions: {
      type: "textarea",
      title: "Missing Permissions Message",
      description: "Message shown if the user lacks the required permissions.",
      default: "🚫 You need the **Manage Server** permission to use this command."
    },

    errorAlreadyLocked: {
      type: "textarea",
      title: "Error: Already Locked",
      description: "Message if the channel is already locked.",
      default: "❌ This channel is already locked."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorAlreadyLocked
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    const channel = event.channel;
    const everyoneRole = event.guild.roles.everyone;

    const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
    const currentSendMessages = currentPerms?.deny?.has("SendMessages");

    if (currentSendMessages) {
      return event.reject(errorAlreadyLocked);
    }

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false
      });

      const author = (commandType(event) === "message") ? event.author : event.user;

      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle(title || null)
        .setDescription(description || null)
        .setFooter({ text: footer, iconURL: author.displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to lock the channel: ${err.message}`);
    }
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("lock")
      .setDescription("Lock the current channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  ) : null
};