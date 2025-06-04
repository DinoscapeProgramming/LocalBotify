if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Flip a coin — heads or tails?",

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
      default: "🎲  Coin Flip"
    },

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

    errorMessage: {
      type: "text",
      title: "Error Message",
      description: "Message to show if something goes wrong.",
      default: "❌ Couldn't flip the coin. Try again!"
    }
  },

  command: async ({
    content,
    title,
    headsText,
    tailsText,
    footer,
    errorMessage
  }, client, event) => {
    try {
      const result = (Math.random() < 0.5) ? headsText : tailsText;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title)
        .setDescription(result)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    }
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};