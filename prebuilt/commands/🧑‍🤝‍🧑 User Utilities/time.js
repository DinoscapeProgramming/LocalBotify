if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const { DateTime } = requireCore("luxon");

module.exports = {
  description: "Get the current time in multiple countries",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],
  
  variables: {
    title: {
      type: "textarea",
      title: "Embed Title",
      description: "The title of the response embed.",
      default: "🕒  World Time"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the response embed.",
      default: ""
    },

    times: {
      type: "textarea",
      title: "Times",
      description: "The times you want to display in the response",
      default: `France: Europe/Paris
Germany: Europe/Berlin
England: Europe/London
Hong Kong: Asia/Hong_Kong
Palestine: Asia/Gaza
Sweden: Europe/Stockholm
USA: America/New_York`
    }
  },

  command: ({
    title,
    description,
    times,
    footer
  }, client, event) => {
    const timezones = Object.fromEntries(times.split("\n").map((timezone) => [timezone.split(": ")[0], timezone.split(": ").slice(1).join(": ")]));

    const fields = Object.entries(timezones).map(([country, tz]) => {
      const time = DateTime.now().setZone(tz).toFormat("HH:mm:ss - dd LLL yyyy");
      return { name: country, value: `\`${time}\``, inline: true };
    });

    const embed = new Discord.EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(description || null)
      .addFields(fields)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};