if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Displays the bot's current permissions in this channel.",

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
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed.",
      default: "🔐  Bot Permissions"
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the embed.",
      default: "Here are ${user} current permissions in <#${channelId}>:\n\n${permissions}"
    },
  },

  command: ({
    content,
    title,
    description,
    footer
  }, client, event) => {
    const channel = event.channel;
    const permissions = channel.permissionsFor(((commandType(event) === "message") ? event.mentions?.members?.first() : event.options.getUser("user")) ? ((commandType(event) === "message") ? event.mentions?.members?.first() : event.options.getUser("user")) : channel.guild.members.me);

    const allPermissions = Object.keys(Discord.PermissionsBitField.Flags);

    const status = allPermissions.map((permission) => {
      const has = permissions.has(permission);
      return `• \`${permission}\`: ${(has) ? "✅" : "❌"}`;
    }).join("\n");

    const embed = new Discord.EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title)
      .setDescription(description.replaceAll("${user}", ((commandType(event) === "message") ? event.mentions?.members?.first() : event.options.getUser("user")) ? `<@${(commandType(event) === "message") ? event.mentions?.members?.first()?.id : event.options.getUser("user")?.id}>'s` : "my").replaceAll("${channelId}", channel.id.toString()).replaceAll("${permissions}", status))
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addUserOption((option) => option
        .setName("user")
        .setDescription("The user to check permissions for. Defaults to the bot if not specified.")
        .setRequired(false)
      )
  ) : null
};