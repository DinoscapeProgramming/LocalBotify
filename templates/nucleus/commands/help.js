if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const fs = require("fs");
const categories = require("../data/categories.json");

module.exports = {
  description: "View all available commands",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    header: {
      type: "text",
      title: "Header",
      description: "The header of the response embed",
      default: "📖  Help Menu${command}"
    }
  },

  command: async ({
    header,
    footer
  }, client, event) => {
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle((header || "📖  Help Menu${command}").replaceAll("${command}", (fs.readdirSync("./commands").includes(`${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`)) ? `: ${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}` : ""))
      .setDescription((!fs.readdirSync("./commands").includes(`${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`)) ? "Here are all available commands, grouped by category:" : require(`../commands/${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`).description)
      .setThumbnail(client.user.displayAvatarURL({ extension: "png" }))
      .addFields(
        ...(!fs.readdirSync("./commands").includes(`${(commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("command")}.js`)) ? [
          ...Object.entries(categories).map(([name, commands]) => ({
            name,
            value: fs.readdirSync("./commands").filter((command) => commands.includes(command.substring(0, command.length - 3))).map((command) => `\`${command.substring(0, command.length - 3)}\``).join(" ")
          })).filter(({ value }) => value.length),
          ...(fs.readdirSync("./commands").filter((command) => !Object.values(categories).flat().includes(command.substring(0, command.length - 3))).length) ? [
            {
              name: "🧰  Miscellaneous",
              value: fs.readdirSync("./commands").filter((command) => !Object.values(categories).flat().includes(command.substring(0, command.length - 3))).map((command) => `\`${command.substring(0, command.length - 3)}\``).join(" ")
            }
          ] : []
        ] : []
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    event.respond({ content: null, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .setName("help")
    .addStringOption((option) => option
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