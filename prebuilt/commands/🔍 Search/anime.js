if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Search for anime information using MyAnimeList via the Jikan API.",

  permissions: ["SEND_MESSAGES", "EMBED_LINKS"],

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
      description: "The title of the embed. Use `{title}`.",
      default: "🎌 Anime Search: {title}"
    },
    embedColor: {
      type: "color",
      title: "Embed Color",
      description: "Color of the embed.",
      default: "#F472B6"
    },
    inline: {
      type: "boolean",
      title: "Inline Fields",
      description: "Whether to display fields inline.",
      default: false
    },
    fieldTitleTitle: {
      type: "text",
      title: "Title Field Title",
      description: "Name of the title field.",
      default: "📺 Title"
    },
    fieldTitleValue: {
      type: "text",
      title: "Title Field Value",
      description: "Value of the title field. Use `{title_english}` or `{title_japanese}`.",
      default: "{title_english} / {title_japanese}"
    },
    fieldEpisodesTitle: {
      type: "text",
      title: "Episodes Field Title",
      description: "Title for the episodes field.",
      default: "📦 Episodes"
    },
    fieldEpisodesValue: {
      type: "text",
      title: "Episodes Field Value",
      description: "Value for the episodes field. Use `{episodes}`.",
      default: "{episodes}"
    },
    fieldScoreTitle: {
      type: "text",
      title: "Score Field Title",
      description: "Title for the score field.",
      default: "⭐ Score"
    },
    fieldScoreValue: {
      type: "text",
      title: "Score Field Value",
      description: "Value for the score field. Use `{score}`.",
      default: "{score}/10"
    },
    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "What to send if nothing is found.",
      default: "❌ Could not find any anime by that name."
    },
    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Message",
      description: "Message to show when no query is provided.",
      default: "❗ Please provide an anime name. Example: `/anime Naruto`"
    }
  },

  command: async (
    {
      content,
      embedTitle,
      embedColor,
      inline,
      fieldTitleTitle,
      fieldTitleValue,
      fieldEpisodesTitle,
      fieldEpisodesValue,
      fieldScoreTitle,
      fieldScoreValue,
      footer,
      errorMessage,
      missingArgs
    },
    client,
    event
  ) => {
    const query =
      commandType(event) === "message"
        ? event.content.split(" ").slice(1).join(" ")
        : event.options.getString("name");

    if (!query) return event.respond(missingArgs);

    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) return event.respond(errorMessage);

    let index = 0;

    const generateEmbed = (anime) => {
      const embed = new Discord.EmbedBuilder()
        .setColor(embedColor)
        .setTitle(embedTitle.replaceAll("{title}", anime.title))
        .setThumbnail(anime.images?.jpg?.image_url)
        .addFields(
          {
            name: fieldTitleTitle,
            value: fieldTitleValue
              .replaceAll("{title_english}", anime.title_english || "N/A")
              .replaceAll("{title_japanese}", anime.title_japanese || "N/A"),
            inline
          },
          {
            name: fieldEpisodesTitle,
            value: fieldEpisodesValue.replaceAll("{episodes}", anime.episodes?.toString() || "Unknown"),
            inline
          },
          {
            name: fieldScoreTitle,
            value: fieldScoreValue.replaceAll("{score}", anime.score?.toString() || "N/A"),
            inline
          }
        )
        .setDescription(anime.synopsis?.substring(0, 500) || "No synopsis available.")
        .setURL(anime.url)
        .setFooter({
          text: footer,
          iconURL: (commandType(event) === "message" ? event.author : event.user).displayAvatarURL()
        })
        .setTimestamp();
      return embed;
    };

    const message = await event.respond({
      content,
      embeds: [generateEmbed(data.data[index])],
      components:
        data.data.length > 1
          ? [
              new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder().setCustomId("prev").setLabel("◀️ Previous").setStyle(1).setDisabled(true),
                new Discord.ButtonBuilder().setCustomId("next").setLabel("Next ▶️").setStyle(1)
              )
            ]
          : []
    });

    if (data.data.length <= 1) return;

    const collector = message.createMessageComponentCollector({
      time: 60_000,
      filter: (i) => i.user.id === (commandType(event) === "message" ? event.author.id : event.user.id)
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      if (interaction.customId === "next") index = (index + 1) % data.data.length;
      else if (interaction.customId === "prev") index = (index - 1 + data.data.length) % data.data.length;

      await interaction.editReply({
        content,
        embeds: [generateEmbed(data.data[index])],
        components: [
          new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder().setCustomId("prev").setLabel("◀️ Previous").setStyle(1),
            new Discord.ButtonBuilder().setCustomId("next").setLabel("Next ▶️").setStyle(1)
          )
        ]
      });
    });

    collector.on("end", async () => {
      await message.edit({
        components: []
      });
    });
  },

  slashCommand: Discord.SlashCommandBuilder ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the anime to search for.")
          .setRequired(true)
      )
  ) : null
};