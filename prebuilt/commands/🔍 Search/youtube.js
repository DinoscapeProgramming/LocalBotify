if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const youtubesearchapi = requireCore("youtube-search-api");

module.exports = {
  description: "Search for YouTube videos by keyword.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content Above Embed",
      description: "Text to show above the embed message.",
      default: ""
    },
    embedColor: {
      type: "color",
      title: "Embed Color",
      description: "Color of the embed.",
      default: "#FF0000"
    },
    embedTitle: {
      type: "text",
      title: "Embed Title",
      description: "Title for the embed.",
      default: "📺  YouTube Results"
    },
    maxResults: {
      type: "number",
      title: "Max Results",
      description: "Max number of results to fetch.",
      default: 10
    },
    fieldFormat: {
      type: "textarea",
      title: "Result Field Format",
      description: "Use {title}, {channel}, {views}, {length}, {url}.",
      default: "**{title}**\n\n📺 {channel} • ⏱️ {length} • 👁️ {views}\n🔗 {url}"
    },
    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Message to send if no results found or an error occurred.",
      default: "❌ No results found or something went wrong!"
    },
    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Message",
      description: "Message to send if no search query is provided.",
      default: "❗ Please provide a search term.\nExample: `/youtube Tokyo`"
    }
  },

  command: async ({
    content,
    embedColor,
    embedTitle,
    maxResults,
    fieldFormat,
    footer,
    errorMessage,
    missingArgs
  }, client, event) => {
    const query = (commandType(event) === "message")
      ? event.content.split(" ").slice(1).join(" ")
      : event.options.getString("query");

    if (!query) return event.respond(missingArgs);

    try {
      const data = await youtubesearchapi.GetListByKeyword(
        query, false, maxResults, [{ type: "video" }]
      );

      const items = data.items.filter((i) => i.type === "video");

      if (!items.length) return event.respond(errorMessage);

      let page = 0;
      const user = (commandType(event) === "message") ? event.author : event.user;

      const buildEmbed = () => {
        const video = items[page];
        const url = `https://youtube.com/watch?v=${video.id}`;
        const views = video.viewCountText || "N/A";
        const length = video.length?.simpleText || "N/A";
        const formatted = fieldFormat
          .replaceAll("{title}", video.title)
          .replaceAll("{channel}", video.channelTitle)
          .replaceAll("{views}", views)
          .replaceAll("{length}", length)
          .replaceAll("{url}", url);

        return new Discord.EmbedBuilder()
          .setColor(embedColor)
          .setTitle(embedTitle)
          .setDescription(formatted)
          .setThumbnail(video.thumbnail.thumbnails[0]?.url || null)
          .setFooter({ text: footer, iconURL: user.displayAvatarURL() })
          .setTimestamp();
      };

      const components = () => {
        return (items.length > 1) ? [{
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "yt_prev",
              label: "◀️",
              disabled: page === 0
            },
            {
              type: 2,
              style: 2,
              custom_id: "yt_index",
              label: `${page + 1} / ${items.length}`,
              disabled: true
            },
            {
              type: 2,
              style: 1,
              custom_id: "yt_next",
              label: "▶️",
              disabled: page === items.length - 1
            }
          ]
        }] : [];
      };

      const message = await event.respond({
        content,
        embeds: [buildEmbed()],
        components: components()
      });

      if (!items.length || items.length === 1) return;

      const collector = message.createMessageComponentCollector({
        time: 60000,
        filter: (i) => i.user.id === user.id
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();
        if (i.customId === "yt_prev" && page > 0) page--;
        else if (i.customId === "yt_next" && page < items.length - 1) page++;

        await message.edit({
          embeds: [buildEmbed()],
          components: components()
        });
      });

    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("Search query for YouTube")
          .setRequired(true)
      )
  ) : null
};