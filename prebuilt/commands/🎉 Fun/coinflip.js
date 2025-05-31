if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Flip a coin — heads or tails?",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    headsText: {
      type: "text",
      title: "Heads Text",
      description: "The message shown when the coin lands on heads.",
      default: "🪙  The coin landed on **Heads!**"
    },
    tailsText: {
      type: "text",
      title: "Tails Text",
      description: "The message shown when the coin lands on tails.",
      default: "🪙  The coin landed on **Tails!**"
    },
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the embed.",
      default: "🎲  Coin Flip"
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
      default: "#f5c518"
    },
    errorMessage: {
      type: "text",
      title: "Error Message",
      description: "Message to show if something goes wrong.",
      default: "❌ Couldn't flip the coin. Try again!"
    }
  },

  command: async ({
    headsText,
    tailsText,
    title,
    content,
    color,
    footer,
    errorMessage
  }, client, event) => {
    try {
      const result = Math.random() < 0.5 ? headsText : tailsText;

      const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(result)
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