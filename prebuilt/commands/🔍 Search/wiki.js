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

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed message. Use {title} for the article title.",
      default: "📚  Wikipedia Article: {title}"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed. Use {extract} for the article summary and {description} for the wiki description.",
      default: "*{description}*\n\n{extract}"
    },

    showImage: {
      type: "switch",
      title: "Show Image",
      description: "Whether to show the thumbnail image if available.",
      default: true
    },

    fieldLinkTitle: {
      type: "textarea",
      title: "Link Field Title",
      description: "Title for the Wikipedia link field.",
      default: "🔗  Read More"
    },

    fieldLinkValue: {
      type: "textarea",
      title: "Link Field Value",
      description: "Value of the link field. Use {url} to include the Wikipedia URL.",
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
    title,
    description,
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

    if (!topic) return event.reject(missingArgs);

    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
      if (!res.ok) return event.reject(errorMessage);

      const data = await res.json();

      if (!data.extract) return event.reject(errorMessage);

      const displayTitle = data.title || topic;
      const wikiUrl = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`;
      const image = data.thumbnail?.source;

      const embed = new Discord.EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title.replaceAll("{title}", displayTitle) || null)
        .setDescription(description.replaceAll("{extract}", data.extract).replaceAll("{description}", data.description || "No description available.") || null)
        .addFields(
          {
            name: fieldLinkTitle,
            value: fieldLinkValue.replaceAll("{url}", wikiUrl),
            inline: false
          }
        )
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      if (showImage && image) embed.setThumbnail(image);

      event.respond({ content, embeds: [embed] });
    } catch {
      event.reject(errorMessage);
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