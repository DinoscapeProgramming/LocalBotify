const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Show info about any specified role by the users",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    responseMessage: {
      title: "Default Response Message",
      type: "text",
      properties: {
        placeholder: "Role not found or invalid role specified."
      }
    }
  },

  command: async (variables, client, event) => {
    const roleName = event.content.split(" ").slice(1).join(" ");
    const role = event.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());

    if (role) {
      const embed = new Discord.EmbedBuilder()
        .setColor(role.color)
        .setTitle(`Role Information: ${role.name}`)
        .addField("ID", role.id, true)
        .addField("Color", role.color.toString(), true)
        .addField("Members Count", role.members.size.toString(), true)
        .addField("Hoisted", role.hoist ? "Yes" : "No", true)
        .addField("Managed", role.managed ? "Yes" : "No", true)
        .setTimestamp();

      ((commandType(event) === "message") ? event.channel.send({ embeds: [embed] }) : event.reply({ embeds: [embed] }));
    } else {
      ((commandType(event) === "message") ? event.channel.send(variables.responseMessage) : event.reply(variables.responseMessage));
    }
  },

  slashCommand: new Discord.SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Show info about any specified role")
    .addStringOption(option => 
      option.setName("rolename")
        .setDescription("The name of the role to retrieve information about")
        .setRequired(true)
    )
};