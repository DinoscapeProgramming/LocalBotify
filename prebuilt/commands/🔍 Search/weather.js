if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the current weather in a specified city.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "Text to show above the embed message.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed message. Use {name} to show the city name.",
      default: "🌤️  Weather - {name}"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "Description of the embed message.",
      default: ""
    },

    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether to display the fields in the embed inline.",
      default: false
    },

    fieldTemperatureTitle: {
      type: "textarea",
      title: "Temperature Field Title",
      description: "Title for the temperature field in the embed.",
      default: "🌡️  Temperature"
    },

    fieldTemperatureValue: {
      type: "textarea",
      title: "Temperature Field Value",
      description: "Value for the temperature field in the embed. Use {temperature} to show the temperature.",
      default: "{temperature}°C"
    },

    fieldWindTitle: {
      type: "textarea",
      title: "Wind Speed Field Title",
      description: "Title for the wind speed field in the embed.",
      default: "💨  Wind Speed"
    },

    fieldWindValue: {
      type: "textarea",
      title: "Wind Speed Field Value",
      description: "Value for the wind speed field in the embed. Use {windspeed} to show the wind speed.",
      default: "{windspeed} km/h"
    },

    fieldConditionTitle: {
      type: "textarea",
      title: "Condition Field Title",
      description: "Title for the weather condition field in the embed.",
      default: "🔍 Weather Code"
    },

    fieldConditionValue: {
      type: "textarea",
      title: "Condition Prefix",
      description: "Value for the weather condition field in the embed. Use {weathercode} to show the weather code.",
      default: "{weathercode}"
    },

    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Message to send if the weather data cannot be retrieved.",
      default: "❌ Could not retrieve weather data. Please check the location."
    },

    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Message",
      description: "Message to send if the user does not provide a city name.",
      default: "❗ Please provide a city name.\nExample: `/weather London`"
    }
  },

  command: async ({
    content,
    title,
    description,
    inline,
    fieldTemperatureTitle,
    fieldTemperatureValue,
    fieldWindTitle,
    fieldWindValue,
    fieldConditionTitle,
    fieldConditionValue,
    footer,
    missingArgs,
    errorMessage
  }, client, event) => {
    const city = (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("city");

    if (!city) return event.reject(missingArgs);

    try {
      const geoResult = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);
      const geoData = await geoResult.json();

      if (!geoData.results || geoData.results.length === 0) return event.reject(errorMessage);

      const location = geoData.results[0];
      const lat = location.latitude;
      const lon = location.longitude;
      const resolvedName = `${location.name}${location.country ? `, ${location.country}` : ""}`;

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const weatherData = await weatherRes.json();

      if (!weatherData.current_weather) return event.reject(errorMessage);

      const weather = weatherData.current_weather;

      const embed = new Discord.EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title.replaceAll("{name}", resolvedName) || null)
        .setDescription(description || null)
        .addFields(
          { name: fieldTemperatureTitle, value: fieldTemperatureValue.replaceAll("{temperature}", weather.temperature.toString()), inline },
          { name: fieldWindTitle, value: fieldWindValue.replaceAll("{windspeed}", weather.windspeed), inline },
          { name: fieldConditionTitle, value: fieldConditionValue.replaceAll("{weathercode}", weather.weathercode), inline }
        )
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      event.reject(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("city")
          .setDescription("City name")
          .setRequired(true)
      )
  ) : null
};