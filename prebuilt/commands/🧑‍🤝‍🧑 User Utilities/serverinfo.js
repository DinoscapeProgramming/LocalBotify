if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Show info about the server",

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
      default: "🌐  Server Information"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the embed. Use {serverName} or {serverId}.",
      default: "Here is some information about **{serverName}**:"
    },

    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },

    serverIdName: {
      type: "textarea",
      title: "Server ID Field",
      description: "The name of the field that will display the server ID.",
      default: "🆔  Server ID"
    },

    serverIdValue: {
      type: "textarea",
      title: "Server ID Value",
      description: "The value of the field that will display the server ID.",
      default: "{serverId}"
    },

    ownerName: {
      type: "textarea",
      title: "Owner Field",
      description: "The name of the field that will display the server owner.",
      default: "👑  Owner"
    },

    ownerValue: {
      type: "textarea",
      title: "Owner Value",
      description: "The value of the field that will display the server owner.",
      default: "<@{ownerId}>"
    },

    createdAtName: {
      type: "textarea",
      title: "Created At Field",
      description: "The name of the field that will display when the server was created.",
      default: "📅  Created At"
    },

    createdAtValue: {
      type: "textarea",
      title: "Created At Value",
      description: "The value of the field that will display when the server was created.",
      default: "<t:{createdAtTimestamp}:F>"
    },

    membersName: {
      type: "textarea",
      title: "Members Field",
      description: "The name of the field that will display the number of members.",
      default: "👥  Members"
    },

    membersValue: {
      type: "textarea",
      title: "Members Value",
      description: "The value of the field that will display the number of members.",
      default: "{memberCount}"
    },

    channelsName: {
      type: "textarea",
      title: "Channels Field",
      description: "The name of the field that will display the number of channels.",
      default: "💬  Channels"
    },

    channelsValue: {
      type: "textarea",
      title: "Channels Value",
      description: "The value of the field that will display the number of channels.",
      default: "{channelCount}"
    },

    rolesName: {
      type: "textarea",
      title: "Roles Field",
      description: "The name of the field that will display the number of roles.",
      default: "🏷️  Roles"
    },

    rolesValue: {
      type: "textarea",
      title: "Roles Value",
      description: "The value of the field that will display the number of roles.",
      default: "{roleCount}"
    },

    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if the command is used outside a server.",
      default: "❌ This command can only be used in a server."
    }
  },

  command: async ({
    content,
    title,
    description,
    inline,
    serverIdName,
    serverIdValue,
    ownerName,
    ownerValue,
    createdAtName,
    createdAtValue,
    membersName,
    membersValue,
    channelsName,
    channelsValue,
    rolesName,
    rolesValue,
    footer,
    errorMessage
  }, client, event) => {
    const guild = event.guild;

    if (!guild) return event.reject(errorMessage);

    const owner = await guild.fetchOwner();
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;

    const embed = new Discord.EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title.replaceAll("{serverName}", guild.name).replaceAll("{serverId}", guild.id) || null)
      .setDescription(description.replaceAll("{serverName}", guild.name).replaceAll("{serverId}", guild.id) || null)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: serverIdName, value: serverIdValue.replaceAll("{serverId}", guild.id), inline },
        { name: ownerName, value: ownerValue.replaceAll("{ownerId}", owner.id), inline },
        { name: createdAtName, value: createdAtValue.replaceAll("{createdAtTimestamp}", Math.floor(guild.createdTimestamp / 1000).toString()), inline },
        { name: membersName, value: membersValue.replaceAll("{memberCount}", guild.memberCount.toString()), inline },
        { name: channelsName, value: channelsValue.replaceAll("{channelCount}", channelCount.toString()), inline },
        { name: rolesName, value: rolesValue.replaceAll("{roleCount}", roleCount.toString()), inline }
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};