if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Rate anything from 1 to 10.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    title: {
      type: "text",
      title: "Embed Title",
      description: "Title of the embed message.",
      default: "📊  Rating"
    },
    format: {
      type: "text",
      title: "Rating Format",
      description: "Use {item} for what is being rated and {score} for the number.",
      default: "I'd rate **{item}** a **{score}/10**!"
    },
    content: {
      type: "textarea",
      title: "Content",
      description: "Regular message above the embed.",
      default: ""
    },
    color: {
      type: "color",
      title: "Embed Color",
      description: "Color of the embed.",
      default: "#ffcc00"
    },
    missingInput: {
      type: "text",
      title: "Missing Input Message",
      description: "Message shown when nothing is provided to rate.",
      default: "❌ You need to tell me what to rate!"
    }
  },

  command: async ({
    title,
    format,
    content,
    color,
    missingInput,
    footer
  }, client, event) => {
    try {
      const args = (event.content?.split(" ").slice(1).join(" ") || "").trim();

      if (!args) return event.respond(missingInput);

      const score = Math.floor(Math.random() * 10) + 1;
      const description = format
        .replace("{item}", args)
        .replace("{score}", score.toString());

      const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({
          text: footer,
          iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL()
        })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.respond("❌ Something went wrong. Try again.");
    }
  },

  slashCommand: (Discord.SlashCommandBuilder)
    ? new Discord.SlashCommandBuilder()
        .setName("rate")
        .setDescription("Rates what you give it")
        .addStringOption(opt =>
          opt.setName("thing")
            .setDescription("What should I rate?")
            .setRequired(true)
        )
    : null
};