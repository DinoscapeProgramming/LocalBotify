if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const fs = require("fs");
const categories = require("../data/categories.json");

module.exports = {
  description: "View all available commands.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the embed.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "The title of the response embed",
      default: "📖  Help Menu${command}"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the response embed",
      default: "Here are all available commands, grouped by category:"
    }
  },

  command: async ({
    content,
    title,
    description,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title.replaceAll("${command}", (fs.readdirSync("./commands").includes(`${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`)) ? `: ${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}` : "") || null)
      .setDescription((!fs.readdirSync("./commands").includes(`${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`)) ? (description || null) : require(`../commands/${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`).description)
      .setThumbnail(client.user.displayAvatarURL({ extension: "png" }))
      .addFields(
        ...(!fs.readdirSync("./commands").includes(`${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`)) ? [
          ...Object.entries(categories || {}).map(([name, commands]) => ({
            name,
            value: fs.readdirSync("./commands").filter((command) => commands.includes(command.substring(0, command.length - 3))).map((command) => `\`${command.substring(0, command.length - 3)}\``).join(" ")
          })).filter(({ value }) => value.length),
          ...(fs.readdirSync("./commands").filter((command) => !Object.values(categories || {}).flat().includes(command.substring(0, command.length - 3))).length) ? [
            {
              name: "🧰  Miscellaneous",
              value: fs.readdirSync("./commands").filter((command) => !Object.values(categories || {}).flat().includes(command.substring(0, command.length - 3))).map((command) => `\`${command.substring(0, command.length - 3)}\``).join(" ")
            }
          ] : []
        ] : []
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription("The command to view")
          .addChoices(
            ...(fs.readdirSync("./commands").map((command) => ({
              name: command.substring(0, command.length - 3),
              value: command.substring(0, command.length - 3)
            })) || []).slice(0, 25)
          )
      )
  ) : null
};