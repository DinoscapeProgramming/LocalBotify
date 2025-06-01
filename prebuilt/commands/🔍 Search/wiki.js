if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Search a Wikipedia article and get a quick summary.",

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
    embedTitle: {
      type: "text",
      title: "Embed Title",
      description: "Title of the embed message. Use `{title}` for the article title.",
      default: "📚  Wikipedia Article: {title}"
    },
    embedColor: {
      type: "color",
      title: "Embed Color",
      description: "Color of the embed.",
      default: "#3C8DBC"
    },
    embedDescription: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed. Use `{extract}` for the article summary and `{description}` for the wiki description.",
      default: "*{description}*\n\n{extract}"
    },
    showImage: {
      type: "boolean",
      title: "Show Image",
      description: "Whether to show the thumbnail image if available.",
      default: true
    },
    fieldLinkTitle: {
      type: "text",
      title: "Link Field Title",
      description: "Title for the Wikipedia link field.",
      default: "🔗  Read More"
    },
    fieldLinkValue: {
      type: "text",
      title: "Link Field Value",
      description: "Value of the link field. Use `{url}` to include the Wikipedia URL.",
      default: "[Click here to read more]({url})"
    },
    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Message to send if no Wikipedia article is found.",
      default: "❌ No Wikipedia article found for that title."
    },
    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Message",
      description: "Message to send if the user does not provide a topic.",
      default: "❗ Please provide a topic to search.\nExample: `/wiki Hello`"
    }
  },

  command: async ({
    content,
    embedTitle,
    embedColor,
    embedDescription,
    showImage,
    fieldLinkTitle,
    fieldLinkValue,
    footer,
    errorMessage,
    missingArgs
  }, client, event) => {
    const topic = (commandType(event) === "message")
      ? event.content.split(" ").slice(1).join(" ")
      : event.options.getString("topic");

    if (!topic) return event.respond(missingArgs);

    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
      if (!res.ok) return event.respond(errorMessage);

      const data = await res.json();

      if (!data.extract) return event.respond(errorMessage);

      const displayTitle = data.title || topic;
      const wikiUrl = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`;
      const image = data.thumbnail?.source;

      const embed = new Discord.EmbedBuilder()
        .setColor(embedColor)
        .setTitle(embedTitle.replaceAll("{title}", displayTitle))
        .setDescription(
          embedDescription
            .replaceAll("{extract}", data.extract)
            .replaceAll("{description}", data.description || "No description available.")
        )
        .addFields({
          name: fieldLinkTitle,
          value: fieldLinkValue.replaceAll("{url}", wikiUrl),
          inline: false
        })
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      if (showImage && image) embed.setThumbnail(image);

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("topic")
          .setDescription("Topic to search on Wikipedia")
          .setRequired(true)
      )
  ) : null
};