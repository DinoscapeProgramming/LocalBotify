if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Shows a random cat image.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "Text to show above the embed.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed.",
      default: "🐱  Meow!"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed.",
      default: ""
    },

    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Message to send if no cat image is found.",
      default: "Failed to fetch a cat. Please try again later!"
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    errorMessage
  }, client, event) => {
    try {
      const res = await fetch("https://api.some-random-api.com/img/cat");
      const data = await res.json();

      if (!data?.link) return event.reject(errorMessage);

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title || null)
        .setDescription(description || null)
        .setImage(data.link)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    }
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};