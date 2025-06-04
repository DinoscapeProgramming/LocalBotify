if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Rate anything from 1 to 10.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "Regular message above the embed.",
      default: ""
    },

    title: {
      type: "text",
      title: "Embed Title",
      description: "Title of the embed message.",
      default: "📊  Rating"
    },

    description: {
      type: "text",
      title: "Embed Description",
      description: "Description of the embed message. Use {item} for what is being rated and {score} for the number.",
      default: "I'd rate **{item}** a **{score}/10**!"
    },

    missingInput: {
      type: "text",
      title: "Missing Input Message",
      description: "Message shown when nothing is provided to rate.",
      default: "❌ You need to tell me what to rate!"
    }
  },

  command: async ({
    content,
    title,
    description,
    footer,
    missingInput,
  }, client, event) => {
    try {
      const args = (event.content?.split(" ").slice(1).join(" ") || "").trim();

      if (!args) return event.respond(missingInput);

      const score = Math.floor(Math.random() * 10) + 1;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title)
        .setDescription(description.replaceAll("{item}", args).replaceAll("{score}", score.toString()))
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond("❌ Something went wrong. Try again.");
    }
  },

  slashCommand: (SlashCommandBuilder)
    ? new SlashCommandBuilder()
        .addStringOption((option) =>
          option.setName("thing")
            .setDescription("What should I rate?")
            .setRequired(true)
        )
    : null
};