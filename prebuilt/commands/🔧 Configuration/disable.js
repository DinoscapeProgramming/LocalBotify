if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const categories = require("../data/categories.json");

module.exports = {
  description: "Disable specific features of the bot.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed",
      default: "🚫  Feature Disabled"
    },
    description: {
      type: "text",
      title: "Embed Description",
      description: "The description of the response embed, use `{feature}` to show the feature that has been disabled.",
      default: "The feature `{feature}` has been disabled."
    },
  },

  command: async ({
    title,
    description,
    footer
  }, client, event) => {
    if ((commandType(event) === "message") && !event.content.split(" ").slice(1).join(" ")) return event.reject("Please provide a feature to disable.");
    if ((((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")) === "all") || Object.keys(categories || {}).includes(((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).substring(4).toLowerCase()) || Object.values(categories || {}).flat().includes((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature"))) return event.reject("Please provide a valid feature to disable, or use `all` to disable all features.");

    if (!event.store.disabledFeatures) (event.store.disabledFeatures = []);
    event.store.disabledFeatures.push((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature"));

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title)
      .setDescription(description.replaceAll("{feature}", (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")))
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("feature")
          .setDescription("Feature to disable (e.g. `all`, `music`, `fun`, etc.)")
          .setRequired(true)
          .addChoices(
            ...[
              ...[
                {
                  name: "all",
                  value: "all"
                }
              ],
              ...Object.keys(categories || {}).map((name) => ({
                name,
                value: name.substring(4).toLowerCase()
              })),
              ...Object.values(categories || {}).flatMap((commands) => commands.map((command) => ({
                name: command,
                value: command
              })))
            ].slice(0, 25)
          )
      )
  ) : null
};