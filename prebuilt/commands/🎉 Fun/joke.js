if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Tells you a random joke.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if no joke is found.",
      default: "❌ Couldn't fetch a joke right now. Try again later!"
    },
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
    color: {
      type: "color",
      title: "Embed Color",
      description: "The color of the embed.",
      default: "#5865F2"
    }
  },

  command: async ({
    errorMessage,
    content,
    generalJokeTitle,
    programmingJokeTitle,
    footer,
    color
  }, client, event) => {
    try {
      const res = await fetch("https://official-joke-api.appspot.com/jokes/random");
      const joke = await res.json();

      if (!joke?.setup || !joke?.punchline) return event.respond(errorMessage);

      const embed = new Discord.EmbedBuilder()
        .setTitle((joke?.type === "general") ? generalJokeTitle : programmingJokeTitle)
        .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
        .setColor(color)
        .setFooter({
          text: footer,
          iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL()
        })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};