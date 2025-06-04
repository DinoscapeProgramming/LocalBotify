if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Tells you a random joke.",

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

    generalJokeTitle: {
      type: "text",
      title: "General Joke Embed Title",
      description: "The title of the embed that contains a general joke.",
      default: ":laughing:  General Joke"
    },

    programmingJokeTitle: {
      type: "text",
      title: "Programming Joke Embed Title",
      description: "The title of the embed that contains a programming joke.",
      default: ":man_technologist:  Programming Joke"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed.",
      default: "**{setup}**\n\n||{punchline}||"
    },

    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if no joke is found.",
      default: "❌ Couldn't fetch a joke right now. Try again later!"
    }
  },

  command: async ({
    content,
    generalJokeTitle,
    programmingJokeTitle,
    description,
    footer,
    errorMessage
  }, client, event) => {
    try {
      const res = await fetch("https://official-joke-api.appspot.com/jokes/random");
      const joke = await res.json();

      if (!joke?.setup || !joke?.punchline) return event.respond(errorMessage);

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle((joke?.type === "general") ? generalJokeTitle : programmingJokeTitle)
        .setDescription(description.replaceAll("{setup}", joke.setup).replaceAll("{punchline}", joke.punchline))
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};