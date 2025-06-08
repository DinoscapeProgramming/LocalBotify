if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const yahooFinance = requireCore("yahoo-finance2").default;

module.exports = {
  description: "Fetch stock information by symbol (e.g., AAPL, TSLA, AMZN).",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content Above Embed",
      description: "Text shown above the stock data.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the stock embed.",
      default: "📈  Stock Info"
    },

    errorMessage: {
      type: "textarea",
      title: "Error Message",
      description: "Shown when symbol is invalid or error occurs.",
      default: "❌ Stock not found or error retrieving data."
    },

    missingArgs: {
      type: "textarea",
      title: "Missing Arguments Message",
      description: "Message when user doesn't provide a symbol.",
      default: "❗ Please provide a stock symbol.\nExample: `/stock AAPL`"
    }
  },

  command: async ({
    content,
    title,
    errorMessage,
    missingArgs,
    footer
  }, client, event) => {
    const symbol = (commandType(event) === "message")
      ? event.content.split(" ")[1]
      : event.options.getString("symbol");

    if (!symbol) return event.reject(missingArgs);

    try {
      const data = await yahooFinance.quote(symbol.toUpperCase());

      if (!data || !data.symbol) return event.rject(errorMessage);

      const price = data.regularMarketPrice;
      const change = data.regularMarketChange;
      const changePercent = data.regularMarketChangePercent;
      const currency = data.currency || "";
      const marketState = data.marketState || "N/A";
      const previousClose = data.regularMarketPreviousClose;
      const open = data.regularMarketOpen;
      const dayHigh = data.regularMarketDayHigh;
      const dayLow = data.regularMarketDayLow;

      const emoji = change > 0 ? "📈" : change < 0 ? "📉" : "➖";

      const embed = new Discord.EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(`${title} (${data.symbol})` || null)
        .setDescription(`**${data.shortName || data.longName || symbol}**\n${emoji} **${price} ${currency}** (${change >= 0 ? "+" : ""}${change.toFixed(2)}, ${changePercent.toFixed(2)}%)`)
        .addFields(
          { name: "Previous Close", value: previousClose?.toString() || "N/A", inline: true },
          { name: "Open", value: open?.toString() || "N/A", inline: true },
          { name: "Day High", value: dayHigh?.toString() || "N/A", inline: true },
          { name: "Day Low", value: dayLow?.toString() || "N/A", inline: true },
          { name: "Market State", value: marketState, inline: true }
        )
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [embed] });
    } catch {
      return event.respond(errorMessage);
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("The stock symbol to search for (e.g., AAPL, TSLA).")
          .setRequired(true)
      )
  ) : null
};