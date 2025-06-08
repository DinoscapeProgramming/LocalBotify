if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Show info about a user",

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
      default: "👤  User Information"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the embed. Use <@{userId}> to mention the user.",
      default: "Here is some information about <@{userId}>:"
    },

    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },

    userIdName: {
      type: "textarea",
      title: "User ID Field",
      description: "The name of the field that will display the user ID.",
      default: "🆔  User ID"
    },

    userIdValue: {
      type: "textarea",
      title: "User ID Value",
      description: "The value of the field that will display the user ID.",
      default: "{userId}"
    },

    usernameName: {
      type: "textarea",
      title: "Username Field",
      description: "The name of the field that will display the username.",
      default: "📛  Username"
    },

    usernameValue: {
      type: "textarea",
      title: "Username Value",
      description: "The value of the field that will display the username.",
      default: "{username}"
    },

    createdAtName: {
      type: "textarea",
      title: "Created At Field",
      description: "The name of the field that will display when the account was created.",
      default: "📅  Created At"
    },

    createdAtValue: {
      type: "textarea",
      title: "Created At Value",
      description: "The value of the field that will display when the account was created.",
      default: "<t:{createdAtTimestamp}:F>"
    },

    joinedAtName: {
      type: "textarea",
      title: "Joined At Field",
      description: "The name of the field that will display when the user joined the server.",
      default: "📥  Joined Server"
    },

    joinedAtValue: {
      type: "textarea",
      title: "Joined At Value",
      description: "The value of the field that will display when the user joined the server.",
      default: "<t:{joinedAtTimestamp}:F>"
    },

    botName: {
      type: "textarea",
      title: "Bot Field",
      description: "The name of the field that will display whether the user is a bot.",
      default: "🤖  Is Bot"
    },

    botValue: {
      type: "textarea",
      title: "Bot Value",
      description: "The value of the field that will display whether the user is a bot.",
      default: "{isBot}"
    },

    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if the user is not mentioned or invalid.",
      default: "Please mention a valid user."
    }
  },

  command: async ({
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
    footer,
    errorMessage
  }, client, event) => {
    let member = (commandType(event) === "message") ? event.mentions?.members?.first() : event.options.getMember("user");

    if (member) {
      const user = member.user;

      const embed = new Discord.EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title.replaceAll("{userId}", user.id) || null)
        .setDescription(description.replaceAll("{userId}", user.id) || null)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: userIdName, value: userIdValue.replaceAll("{userId}", user.id), inline },
          { name: usernameName, value: usernameValue.replaceAll("{username}", user.tag), inline },
          { name: createdAtName, value: createdAtValue.replaceAll("{createdAtTimestamp}", Math.floor(user.createdTimestamp / 1000).toString()), inline },
          { name: joinedAtName, value: joinedAtValue.replaceAll("{joinedAtTimestamp}", Math.floor(member.joinedTimestamp / 1000).toString()), inline },
          { name: botName, value: botValue.replaceAll("{isBot}", user.bot ? "Yes" : "No"), inline }
        )
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } else {
      event.reject(errorMessage);
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