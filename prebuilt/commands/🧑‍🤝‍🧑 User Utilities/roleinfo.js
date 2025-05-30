if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Show info about a pinged role",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if the role is not mentioned or invalid.",
      default: "Please mention a valid role."
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
      default: "📘  Role Information"
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the embed. Use <@&${roleId}> to mention the role.",
      default: "Here is some information about <@&${roleId}>:"
    },
    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },
    roleIdName: {
      type: "text",
      title: "Role ID Field",
      description: "The name of the field that will display the role ID in the embed.",
      default: "🆔  Role ID"
    },
    roleIdValue: {
      type: "text",
      title: "Role ID Value",
      description: "The value of the field that will display the role ID in the embed.",
      default: "${roleId}"
    },
    createdAtName: {
      type: "text",
      title: "Created At Field",
      description: "The name of the field that will display when the role was created.",
      default: "📅  Created At"
    },
    createdAtValue: {
      type: "text",
      title: "Created At Value",
      description: "The value of the field that will display when the role was created.",
      default: "<t:${createdAtTimestamp}:F>"
    },
    colorName: {
      type: "text",
      title: "Color Field",
      description: "The name of the field that will display the role color.",
      default: "🎨  Color"
    },
    colorValue: {
      type: "text",
      title: "Color Value",
      description: "The value of the field that will display the role color.",
      default: "#${colorHex}"
    },
    membersName: {
      type: "text",
      title: "Members Field",
      description: "The name of the field that will display the number of members with this role.",
      default: "👥  Members"
    },
    membersValue: {
      type: "text",
      title: "Members Value",
      description: "The value of the field that will display the number of members with this role.",
      default: "${membersCount}"
    },
    mentionableName: {
      type: "text",
      title: "Mentionable Field",
      description: "The name of the field that will display if the role is mentionable.",
      default: "🔒  Mentionable"
    },
    mentionableValue: {
      type: "text",
      title: "Mentionable Value",
      description: "The value of the field that will display if the role is mentionable.",
      default: "${mentionableStatus}"
    },
    positionName: {
      type: "text",
      title: "Position Field",
      description: "The name of the field that will display the role's position in the hierarchy.",
      default: "📌  Position"
    },
    positionValue: {
      type: "text",
      title: "Position Value",
      description: "The value of the field that will display the role's position in the hierarchy.",
      default: "${rolePosition}"
    }
  },

  command: async ({
    errorMessage,
    content,
    title,
    description,
    inline,
    roleIdName,
    roleIdValue,
    createdAtName,
    createdAtValue,
    colorName,
    colorValue,
    membersName,
    membersValue,
    mentionableName,
    mentionableValue,
    positionName,
    positionValue,
    footer
  }, client, event) => {
    let role = (commandType(event) === "message") ? event.mentions?.roles?.first() : event.options.getRole("role");

    if (role) {
      const embed = new Discord.EmbedBuilder()
        .setColor(role.color || 0x00bfff)
        .setTitle(title.replaceAll("${roleId}", role.id.toString()))
        .setDescription(description.replaceAll("${roleId}", role.id.toString()))
        .addFields(
          { name: roleIdName, value: roleIdValue.replaceAll("${roleId}", role.id.toString()), inline },
          { name: createdAtName, value: createdAtValue.replaceAll("${createdAtTimestamp}", Math.floor(role.createdTimestamp / 1000).toString()), inline },
          { name: colorName, value: colorValue.replaceAll("${colorHex}", role.color.toString(16).padStart(6, "0")), inline },
          { name: membersName, value: membersValue.replaceAll("${membersCount}", role.members.size.toString()), inline },
          { name: mentionableName, value: mentionableValue.replaceAll("${mentionableStatus}", (role.mentionable) ? "Yes" : "No"), inline },
          { name: positionName, value: positionValue.replaceAll("${rolePosition}", role.position.toString()), inline }
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
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Select the role to view info")
          .setRequired(true)
      )
  ) : null
};