if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the response embed",
      default: ""
    },
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed",
      default: "🖼️  Avatar"
    }
  },

  command: async ({
    content,
    title,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title.replaceAll("${userId}", ((commandType(event) === "message") ? event.mentions.users.first()?.id : event.options.getUser("user")?.id) || ((commandType(event) === "message") ? event.author.id : event.user.id)))
      .setImage(((commandType(event) === "message") ? event.mentions.users.first()?.displayAvatarURL({ size: 512, dynamic: true }) : event.options.getUser("user")?.displayAvatarURL({ size: 512, dynamic: true })) || ((commandType(event) === "message") ? event.author.displayAvatarURL({ size: 512, dynamic: true }) : event.user.displayAvatarURL({ size: 512, dynamic: true })))
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: content.replaceAll("${userId}", ((commandType(event) === "message") ? event.mentions.users.first()?.id : event.options.getUser("user")?.id) || ((commandType(event) === "message") ? event.author.id : event.user.id)), embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The member you want to view their profile picture of")
				.setRequired(false))) : null
};