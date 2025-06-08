if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const categories = require("../data/categories.json");

module.exports = {
  description: "Disable specific features of the bot.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
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
      description: "The description of the response embed. Use {feature} to show the feature that has been disabled.",
      default: "The feature `{feature}` has been disabled."
    },
  },

  command: async ({
    title,
    description,
    footer
  }, client, event) => {
    if (!event.member.permissions.has("ManageGuild")) return event.reject("🚫 You need the **Manage Server** permission to use this command.");
    if ((commandType(event) === "message") && !event.content.split(" ").slice(1).join(" ")) return event.reject("Please provide a feature to disable.");
    if ((((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).toLowerCase() !== "all") && !Object.keys(categories || {}).map((name) => name.replace(/^[^\w]+/, "").trim().toLowerCase()).includes(((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).toLowerCase()) && !Object.values(categories || {}).flat().includes(((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).toLowerCase())) return event.reject("Please provide a valid feature to disable.");

    if (!event.store.disabledFeatures) (event.store.disabledFeatures = []);
    event.store.disabledFeatures.push(((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).toLowerCase());

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(description.replaceAll("{feature}", (Object.keys(categories || {}).map((name) => name.replace(/^[^\w]+/, "").trim().toLowerCase()).includes((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature"))) ? Object.keys(categories || {}).find((name) => (name.replace(/^[^\w]+/, "").trim().toLowerCase() === ((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).toLowerCase())).replaceAll("   ", " ") : ((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("feature")).toLowerCase()) || null)
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
                value: name.replace(/^[^\w]+/, "").trim().toLowerCase()
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