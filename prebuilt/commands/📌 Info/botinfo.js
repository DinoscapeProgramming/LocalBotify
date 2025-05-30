if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Show info about the bot",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
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
      default: "🤖  Bot Information"
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the embed. Use ${botName} or ${botId}.",
      default: "Here is some information about **${botName}**:"
    },
    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },
    botIdName: {
      type: "text",
      title: "Bot ID Field",
      description: "The name of the field that will display the bot ID.",
      default: "🆔  Bot ID"
    },
    botIdValue: {
      type: "text",
      title: "Bot ID Value",
      description: "The value of the field that will display the bot ID.",
      default: "${botId}"
    },
    usernameName: {
      type: "text",
      title: "Bot Tag Field",
      description: "The name of the field that will display the bot's tag.",
      default: "📛  Bot Tag"
    },
    usernameValue: {
      type: "text",
      title: "Bot Tag Value",
      description: "The value of the field that will display the bot's tag.",
      default: "${botTag}"
    },
    createdAtName: {
      type: "text",
      title: "Created At Field",
      description: "The name of the field that will display when the bot account was created.",
      default: "📅  Created At"
    },
    createdAtValue: {
      type: "text",
      title: "Created At Value",
      description: "The value of the field that will display the bot creation time.",
      default: "<t:${createdAtTimestamp}:F>"
    },
    serversName: {
      type: "text",
      title: "Servers Field",
      description: "The name of the field that will show how many servers the bot is in.",
      default: "🌍  Servers"
    },
    serversValue: {
      type: "text",
      title: "Servers Value",
      description: "The value of the field that will show how many servers the bot is in.",
      default: "${serverCount}"
    },
    usersName: {
      type: "text",
      title: "Users Field",
      description: "The name of the field that will show how many users the bot can see.",
      default: "👥  Users"
    },
    usersValue: {
      type: "text",
      title: "Users Value",
      description: "The value of the field that will show how many users the bot can see.",
      default: "${userCount}"
    }
  },

  command: async ({
    content,
    title,
    description,
    inline,
    botIdName,
    botIdValue,
    usernameName,
    usernameValue,
    createdAtName,
    createdAtValue,
    serversName,
    serversValue,
    usersName,
    usersValue,
    footer
  }, client, event) => {
    const botUser = client.user;

    const serverCount = client.guilds.cache.size;
    const userCount = Math.max(client.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, -1 * client.guilds.cache.size), 0);

    const embed = new Discord.EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title.replaceAll("${botName}", botUser.username).replaceAll("${botId}", botUser.id))
      .setDescription(description.replaceAll("${botName}", botUser.username).replaceAll("${botId}", botUser.id))
      .setThumbnail(botUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: botIdName, value: botIdValue.replaceAll("${botId}", botUser.id), inline },
        { name: usernameName, value: usernameValue.replaceAll("${botTag}", botUser.tag), inline },
        { name: createdAtName, value: createdAtValue.replaceAll("${createdAtTimestamp}", Math.floor(botUser.createdTimestamp / 1000).toString()), inline },
        { name: serversName, value: serversValue.replaceAll("${serverCount}", serverCount.toString()), inline },
        { name: usersName, value: usersValue.replaceAll("${userCount}", userCount.toString()), inline }
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};