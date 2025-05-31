if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Roll a virtual die (default 1–6)",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
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
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the embed.",
      default: "🎲  Dice Roll"
    },
    resultMessage: {
      type: "text",
      title: "Result Message",
      description: "Use {number} to show the rolled value.",
      default: "You rolled a **{number}**!"
    },
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the embed.",
      default: ""
    },
    color: {
      type: "color",
      title: "Embed Color",
      description: "The color of the embed.",
      default: "#4caf50"
    },
    errorMessage: {
      type: "text",
      title: "Error Message",
      description: "Message shown if something goes wrong.",
      default: "❌ Couldn't roll the dice. Try again!"
    }
  },

  command: async ({
    min,
    max,
    title,
    resultMessage,
    content,
    color,
    errorMessage,
    footer
  }, client, event) => {
    try {
      min = Number(min);
      max = Number(max);

      if (isNaN(min) || isNaN(max) || min >= max) return event.respond("⚠️ Invalid min/max values!");

      const rolled = Math.floor(Math.random() * (max - min + 1)) + min;
      const description = resultMessage.replace("{number}", rolled.toString());

      const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({
          text: footer,
          iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL()
        })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    }
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};