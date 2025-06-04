if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Roll a virtual die.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the embed.",
      default: ""
    },

    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the embed.",
      default: "🎲  Dice Roll"
    },

    description: {
      type: "text",
      title: "Description",
      description: "The description of the embed. Use {number} to show the rolled value.",
      default: "You rolled a **{number}**!"
    },

    min: {
      type: "number",
      title: "Minimum Number",
      description: "Lowest number the die can roll.",
      default: 1
    },

    max: {
      type: "number",
      title: "Maximum Number",
      description: "Highest number the die can roll.",
      default: 6
    },

    errorMessage: {
      type: "text",
      title: "Error Message",
      description: "Message shown if something goes wrong.",
      default: "❌ Couldn't roll the dice. Try again!"
    }
  },

  command: async ({
    content,
    title,
    description,
    min,
    max,
    footer,
    errorMessage,
  }, client, event) => {
    try {
      min = Number(min);
      max = Number(max);

      if (isNaN(min) || isNaN(max) || min >= max) return event.respond("⚠️ Invalid min/max values!");

      const rolled = Math.floor(Math.random() * (max - min + 1)) + min;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title)
        .setDescription(description.replaceAll("{number}", rolled.toString()))
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    }
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};