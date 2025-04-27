const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's uptime",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    responseMessage: {
      title: "Uptime Response Message",
      type: "text",
      properties: {
        placeholder: "The bot has been online for {uptime}"
      }
    }
  },

  command: (variables, client, event) => {
    const uptime = Math.floor(client.uptime / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const embed = new Discord.EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Bot Uptime")
      .setDescription(variables.responseMessage.replace("{uptime}", uptimeString));

    if (commandType(event) === "message") {
      event.channel.send({ embeds: [embed] });
    } else if (commandType(event) === "interaction") {
      event.reply({ embeds: [embed] });
    }
  },

  slashCommand: new Discord.SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Check the bot's uptime")
};