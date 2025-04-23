const { EmbedBuilder, SlashCommandBuilder } = require("../../../node_modules/discord.js/src/index.js");
const { commandType } = require("../../../node_modules/localbotify/index.js");

module.exports = {
  description: "Ban a user from the server",

  permissions: [
    "SEND_MESSAGES",
    "BAN_MEMBERS",
    "MANAGE_MESSAGES"
  ],

  variables: {
    banMessage: {
      title: "Ban Message",
      description: "The message sent when a user is banned",
      type: "text",
      properties: {
        placeholder: "You have been banned from the server."
      }
    },
    defaultReason: {
      title: "Default Ban Reason",
      description: "The default reason if no reason is provided",
      type: "text",
      properties: {
        placeholder: "Violation of server rules"
      }
    }
  },

  command: (variables, client, event) => {
    const user = event.mentions.users.first();
    const reason = variables.defaultReason || "No reason provided.";
    
    if (!user) return event.reply("User not found.");
    const member = event.guild.members.cache.get(user.id);
    if (!member) return event.reply("User is not a member of this server.");

    member.ban({ reason })
      .then(() => {
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("User Banned 🚫")
          .setDescription(`${user.tag} has been banned.`)
          .addField("Reason", reason)
          .setFooter(`Banned by ${event.author.tag}`)
          .setTimestamp();

        ((commandType(event) === "message") ? event.channel.send({ embeds: [embed] }) : event.reply({ embeds: [embed] }));
      })
      .catch(() => event.reply("Unable to ban user."));
  },

  slashCommand: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .addUserOption(option => option.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Reason for the ban"))
};