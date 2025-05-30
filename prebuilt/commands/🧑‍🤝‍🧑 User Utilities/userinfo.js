if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Show info about a user",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if the user is not mentioned or invalid.",
      default: "Please mention a valid user."
    },
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
      default: "👤  User Information"
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the embed. Use <@${userId}> to mention the user.",
      default: "Here is some information about <@${userId}>:"
    },
    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },
    userIdName: {
      type: "text",
      title: "User ID Field",
      description: "The name of the field that will display the user ID.",
      default: "🆔  User ID"
    },
    userIdValue: {
      type: "text",
      title: "User ID Value",
      description: "The value of the field that will display the user ID.",
      default: "${userId}"
    },
    usernameName: {
      type: "text",
      title: "Username Field",
      description: "The name of the field that will display the username.",
      default: "📛  Username"
    },
    usernameValue: {
      type: "text",
      title: "Username Value",
      description: "The value of the field that will display the username.",
      default: "${username}"
    },
    createdAtName: {
      type: "text",
      title: "Created At Field",
      description: "The name of the field that will display when the account was created.",
      default: "📅  Created At"
    },
    createdAtValue: {
      type: "text",
      title: "Created At Value",
      description: "The value of the field that will display when the account was created.",
      default: "<t:${createdAtTimestamp}:F>"
    },
    joinedAtName: {
      type: "text",
      title: "Joined At Field",
      description: "The name of the field that will display when the user joined the server.",
      default: "📥  Joined Server"
    },
    joinedAtValue: {
      type: "text",
      title: "Joined At Value",
      description: "The value of the field that will display when the user joined the server.",
      default: "<t:${joinedAtTimestamp}:F>"
    },
    botName: {
      type: "text",
      title: "Bot Field",
      description: "The name of the field that will display whether the user is a bot.",
      default: "🤖  Is Bot"
    },
    botValue: {
      type: "text",
      title: "Bot Value",
      description: "The value of the field that will display whether the user is a bot.",
      default: "${isBot}"
    }
  },

  command: async ({
    errorMessage,
    content,
    title,
    description,
    inline,
    userIdName,
    userIdValue,
    usernameName,
    usernameValue,
    createdAtName,
    createdAtValue,
    joinedAtName,
    joinedAtValue,
    botName,
    botValue,
    footer
  }, client, event) => {
    let member = (commandType(event) === "message") ? event.mentions?.members?.first() : event.options.getMember("user");

    if (member) {
      const user = member.user;

      const embed = new Discord.EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title.replaceAll("${userId}", user.id))
        .setDescription(description.replaceAll("${userId}", user.id))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: userIdName, value: userIdValue.replaceAll("${userId}", user.id), inline },
          { name: usernameName, value: usernameValue.replaceAll("${username}", user.tag), inline },
          { name: createdAtName, value: createdAtValue.replaceAll("${createdAtTimestamp}", Math.floor(user.createdTimestamp / 1000).toString()), inline },
          { name: joinedAtName, value: joinedAtValue.replaceAll("${joinedAtTimestamp}", Math.floor(member.joinedTimestamp / 1000).toString()), inline },
          { name: botName, value: botValue.replaceAll("${isBot}", user.bot ? "Yes" : "No"), inline }
        )
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } else {
      event.respond({ content: errorMessage, ephemeral: (commandType(event) === "interaction") });
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Select the user to view info")
          .setRequired(true)
      )
  ) : null
};