if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Fetch a random meme from Reddit.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the response embed.",
      default: ""
    },

    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed.",
      default: "🖼️  Meme"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed.",
      default: ""
    },

    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if no meme is found.",
      default: "❌ Failed to fetch a meme. Please try again later."
    },

    unsafeMessage: {
      type: "textarea",
      title: "Unsafe Meme Response Message",
      description: "The message to send if the meme is unsafe or NSFW.",
      default: "⚠️ Couldn't find a safe meme. Try again!"
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    errorMessage,
    unsafeMessage,
  }, client, event) => {
    try {
      const res = await fetch("https://meme-api.com/gimme");
      const data = await res.json();

      if (!data || data.nsfw || data.spoiler) return event.respond(unsafeMessage);

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title)
        .setDescription(description)
        .setImage(data.url)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp()

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};