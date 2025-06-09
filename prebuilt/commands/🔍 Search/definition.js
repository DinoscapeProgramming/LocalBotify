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
      title: "Content",
      description: "Text to show above the embed message.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed message. Use {word} to show the queried word.",
      default: "📖  Definition of \"{word}\""
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed message.",
      default: ""
    },

    fieldPartOfSpeechTitle: {
      type: "textarea",
      title: "Part of Speech Field Title",
      description: "Title for the part of speech field.",
      default: "Part of Speech"
    },

    fieldDefinitionTitle: {
      type: "textarea",
      title: "Definition Field Title",
      description: "Title for the definition field.",
      default: "Definition"
    },

    fieldExampleTitle: {
      type: "textarea",
      title: "Example Sentence Field Title",
      description: "Title for the example sentence field.",
      default: "Example"
    },

    noExampleText: {
      type: "textarea",
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
    title,
    description,
    fieldPartOfSpeechTitle,
    fieldDefinitionTitle,
    fieldExampleTitle,
    noExampleText,
    footer,
    errorMessage,
    missingArgs
  }, client, event) => {
    const word = (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ").toLowerCase() : event.options.getString("word").toLowerCase();

    if (!word) return event.reject(missingArgs);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return event.reject(errorMessage);

      const data = await res.json();

      if (data.title === "No Definitions Found") return event.reject(errorMessage);

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
          .setColor(0x00bfff)
          .setTitle(title.replaceAll("{word}", entry.word) || null)
          .setDescription(description || null)
          .addFields(
            { name: fieldPartOfSpeechTitle, value: definition.partOfSpeech || "N/A", inline: true },
            { name: fieldDefinitionTitle, value: definition.definition, inline: false },
            { name: fieldExampleTitle, value: definition.example, inline: false }
          )
          .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
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
      event.reject(errorMessage);
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