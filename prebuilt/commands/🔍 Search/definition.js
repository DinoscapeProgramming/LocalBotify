if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Get the definition of a word from DictionaryAPI with multiple definition navigation.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "USE_EXTERNAL_EMOJIS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content Above Embed",
      description: "Text to show above the embed message.",
      default: ""
    },
    embedTitle: {
      type: "text",
      title: "Embed Title",
      description: "Title of the embed message. Use `{word}` to show the queried word.",
      default: "📖  Definition of \"{word}\""
    },
    embedColor: {
      type: "color",
      title: "Embed Color",
      description: "Color of the embed.",
      default: "#0099ff"
    },
    fieldPartOfSpeechTitle: {
      type: "text",
      title: "Part of Speech Field Title",
      description: "Title for the part of speech field.",
      default: "Part of Speech"
    },
    fieldDefinitionTitle: {
      type: "text",
      title: "Definition Field Title",
      description: "Title for the definition field.",
      default: "Definition"
    },
    fieldExampleTitle: {
      type: "text",
      title: "Example Sentence Field Title",
      description: "Title for the example sentence field.",
      default: "Example"
    },
    noExampleText: {
      type: "text",
      title: "No Example Text",
      description: "Text to show when no example sentence is available.",
      default: "No example provided."
    },
    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Message to send if no definitions are found or on other errors.",
      default: "❌ No definitions found for this word."
    },
    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Message",
      description: "Message to send if the user does not provide a word.",
      default: "❗ Please provide a word to define.\nExample: `/definition hello`"
    }
  },

  command: async ({
    content,
    embedTitle,
    embedColor,
    fieldPartOfSpeechTitle,
    fieldDefinitionTitle,
    fieldExampleTitle,
    noExampleText,
    footer,
    errorMessage,
    missingArgs
  }, client, event) => {
    const word = (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ").toLowerCase() : event.options.getString("word").toLowerCase();

    if (!word) return event.respond(missingArgs);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return event.respond(errorMessage);

      const data = await res.json();

      if (data.title === "No Definitions Found") return event.respond(errorMessage);

      const entry = data[0];

      const definitions = [];
      entry.meanings.forEach(meaning => {
        meaning.definitions.forEach(def => {
          definitions.push({
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example || noExampleText
          });
        });
      });

      if (definitions.length === 0) return event.respond(errorMessage);

      let currentIndex = 0;

      const createEmbed = (index) => {
        const definition = definitions[index];
        return new Discord.EmbedBuilder()
          .setColor(embedColor)
          .setTitle(embedTitle.replaceAll("{word}", entry.word))
          .addFields(
            { name: fieldPartOfSpeechTitle, value: definition.partOfSpeech || "N/A", inline: true },
            { name: fieldDefinitionTitle, value: definition.definition, inline: false },
            { name: fieldExampleTitle, value: definition.example, inline: false }
          )
          .setFooter({ text: `${footer} — ${index + 1}/${definitions.length}`, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
          .setTimestamp();
      };

      const row = new Discord.ActionRowBuilder()
        .addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("prev_def")
            .setLabel("⬅️ Previous")
            .setStyle(Discord.ButtonStyle.Primary)
            .setDisabled(definitions.length === 1),
          new Discord.ButtonBuilder()
            .setCustomId("next_def")
            .setLabel("Next ➡️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setDisabled(definitions.length === 1)
        );

      const reply = await event.respond({ content, embeds: [createEmbed(currentIndex)], components: [row] });

      if (definitions.length <= 1) return;

      const msg = (commandType(event) === "message") ? reply : await event.getReply();

      const collector = msg.createMessageComponentCollector({
        componentType: Discord.ComponentType.Button
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== ((commandType(event) === "message") ? event.author.id : event.user.id)) {
          return interaction.reply({ content: "❌ You can't use these buttons.", ephemeral: true });
        };

        if (interaction.customId === "prev_def") {
          currentIndex = (currentIndex === 0) ? definitions.length - 1 : currentIndex - 1;
        } else if (interaction.customId === "next_def") {
          currentIndex = (currentIndex === definitions.length - 1) ? 0 : currentIndex + 1;
        };

        await interaction.update({ embeds: [createEmbed(currentIndex)], components: [row] });
      });

      collector.on("end", () => {
        const disabledRow = new Discord.ActionRowBuilder()
          .addComponents(
            new Discord.ButtonBuilder()
              .setCustomId("prev_def")
              .setLabel("⬅️ Previous")
              .setStyle(Discord.ButtonStyle.Primary)
              .setDisabled(true),
            new Discord.ButtonBuilder()
              .setCustomId("next_def")
              .setLabel("Next ➡️")
              .setStyle(Discord.ButtonStyle.Primary)
              .setDisabled(true)
          );

        msg.edit({ components: [disabledRow] }).catch(() => {});
      });
    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("word")
          .setDescription("Word to define")
          .setRequired(true)
      )
  ) : null
};