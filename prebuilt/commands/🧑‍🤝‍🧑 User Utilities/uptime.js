const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's uptime",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    title: {
      type: "textarea",
      title: "Embed Title",
      description: "The title of the embed that will be sent in response to the command.",
      default: "⏱️  Bot Uptime"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The message to display in the embed. Use {days}, {hours}, {minutes}, and {seconds} to show the respective values.",
      default: "The bot has been online for {days}d {hours}h {minutes}m {seconds}s."
    }
  },

  command: ({
    title,
    description,
    footer
  }, client, event) => {
    const uptime = Math.floor(client.uptime / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const embed = new Discord.EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(description.replaceAll("{days}", days).replaceAll("{hours}", hours).replaceAll("{minutes}", minutes).replaceAll("{seconds}", seconds) || null)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};