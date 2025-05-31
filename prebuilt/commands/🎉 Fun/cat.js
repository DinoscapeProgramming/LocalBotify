if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Shows a random cat image.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Message to send if no cat image is found.",
      default: "❌ Failed to fetch a cat. Please try again later!"
    },
    content: {
      type: "textarea",
      title: "Content",
      description: "Text to show above the embed.",
      default: ""
    },
    title: {
      type: "text",
      title: "Embed Title",
      description: "Title of the embed.",
      default: "🐱  Meow!"
    },
    color: {
      type: "color",
      title: "Embed Color",
      description: "Color of the embed.",
      default: "#ff69b4"
    }
  },

  command: async ({
    errorMessage,
    content,
    title,
    color,
    footer
  }, client, event) => {
    try {
      const res = await fetch("https://api.some-random-api.com/img/cat");
      const data = await res.json();

      if (!data?.link) return event.respond(errorMessage);

      const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setImage(data.link)
        .setColor(color)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    }
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};