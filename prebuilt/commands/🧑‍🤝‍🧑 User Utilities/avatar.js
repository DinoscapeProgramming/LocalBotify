if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the response embed.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "The title of the response embed.",
      default: "🖼️  Avatar"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the reponse embed.",
      default: ""
    }
  },

  command: async ({
    content,
    title,
    description,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title.replaceAll("{userId}", ((commandType(event) === "message") ? event.mentions.users.first()?.id : event.options.getUser("user")?.id) || ((commandType(event) === "message") ? event.author.id : event.user.id)) || null)
      .setDescription(description || null)
      .setImage(((commandType(event) === "message") ? event.mentions.users.first()?.displayAvatarURL({ size: 512, dynamic: true }) : event.options.getUser("user")?.displayAvatarURL({ size: 512, dynamic: true })) || ((commandType(event) === "message") ? event.author.displayAvatarURL({ size: 512, dynamic: true }) : event.user.displayAvatarURL({ size: 512, dynamic: true })))
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: content.replaceAll("{userId}", ((commandType(event) === "message") ? event.mentions.users.first()?.id : event.options.getUser("user")?.id) || ((commandType(event) === "message") ? event.author.id : event.user.id)), embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The member you want to view their profile picture of")
				.setRequired(false))) : null
};