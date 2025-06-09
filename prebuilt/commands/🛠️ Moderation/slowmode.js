if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const ms = requireCore("ms");

module.exports = {
  description: "Set a slowmode delay for a channel.",

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
      default: "🐢  Slowmode Updated"
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

    errorInvalidDuration: {
      type: "textarea",
      title: "Error: Invalid Duration",
      description: "Message shown if the provided duration is not valid.",
      default: "❌ Invalid duration. Use formats like `10s`, `2m`, `1h`."
    },

    errorOutOfRange: {
      type: "textarea",
      title: "Error: Out of Range",
      description: "Message shown if the duration is not between 0s and 6h.",
      default: "❌ Duration must be between 0 seconds and 6 hours."
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingPermissions,
    errorInvalidDuration,
    errorOutOfRange
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject(missingPermissions);

    let durationArg;
    if (commandType(event) === "message") {
      durationArg = event.content.split(" ")[1];
    } else {
      durationArg = event.options.getString("duration");
    }

    const duration = ms(durationArg);

    if (duration == null) return event.reject(errorInvalidDuration);
    const seconds = Math.floor(duration / 1000);

    if (seconds < 0 || seconds > 21600) return event.reject(errorOutOfRange);

    try {
      await event.channel.setRateLimitPerUser(seconds);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(title || null)
        .setDescription(description || `Slowmode for <#${event.channel.id}> set to **${durationArg}** (${seconds}s).`)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch (err) {
      event.reject(`❌ Failed to set slowmode: ${err.message}`);
    }
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .setName("slowmode")
      .setDescription("Set the slowmode delay for the current channel")
      .addStringOption(option =>
        option.setName("duration")
          .setDescription("Slowmode duration (e.g. 10s, 5m, 1h)")
          .setRequired(true)
      )
  ) : null
};