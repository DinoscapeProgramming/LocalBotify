if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Translate text into a specified language.",

  permissions: ["SEND_MESSAGES", "EMBED_LINKS"],

  variables: {
    content: {
      type: "textarea",
      title: "Content Above Embed",
      description: "Text to show above the embed message.",
      default: ""
    },
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the embed that shows the translation.",
      default: "🌍  Translation"
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed. Use `{language}` for the language code and `{result}` for the translated text.",
      default: "**Translated to \`{language}\`:**\n{result}"
    },
    embedColor: {
      type: "color",
      title: "Embed Color",
      description: "The color of the embed. Use a hex color code.",
      default: "#2ecc71"
    },
    errorMessage: {
      type: "textarea",
      title: "Invalid Language Error",
      description: "Message to send if the language code is invalid or translation fails.",
      default: "❌ Invalid language code. Please use a supported locale like `en`, `es`, `fr`, etc."
    },
    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Error",
      description: "Message to send if the user doesn't provide a language code or text to translate.",
      default: "❗ Please provide a language code and some text to translate.\nExample: `/translate en Hola mundo`"
    }
  },

  command: async (
    {
      content,
      title,
      description,
      footer,
      embedColor,
      errorMessage,
      missingArgs
    }, client, event
  ) => {
    const user = (commandType(event) === "message") ? event.author : event.user;

    const language = (commandType(event) === "message") ? event.content.split(" ")[1] : event.options.getString("language");
    const text = (commandType(event) === "message") ? event.content.split(" ").slice(2).join(" ") : event.options.getString("text");

    if (!language || !text) return event.respond(missingArgs);

    const url = `https://translate-service.scratch.mit.edu/translate?language=${encodeURIComponent(language)}&text=${encodeURIComponent(text)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.result) {
        const embed = new Discord.EmbedBuilder()
          .setColor(embedColor)
          .setTitle(title)
          .setDescription(description.replaceAll("{language}", language).replaceAll("{result}", data.result))
          .setFooter({ text: footer, iconURL: user.displayAvatarURL() })
          .setTimestamp();

        event.respond({ content, embeds: [embed] });
      } else {
        event.respond(errorMessage);
      };
    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("language")
          .setDescription("Language code (e.g., en, es)")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("Text to translate")
          .setRequired(true)
      )
  ) : null
};