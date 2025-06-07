global.isLocalBotify = (require("path").basename(require("path").join(process.cwd(), "..")) === "bots");
global.isPackaged = (global.isLocalBotify) ? require("fs").existsSync(require("path").join(process.cwd(), "../../resources/app.asar.unpackaged/node_modules")) : null;
global.importCore = (global.isLocalBotify) ? ((module) => import(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, JSON.parse(require("fs").readFileSync(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, "package.json"), "utf8") || "{}").main || "index.js"))) : ((module) => import(module));
global.requireCore = (global.isLocalBotify) ? ((module) => require(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, JSON.parse(require("fs").readFileSync(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, "package.json"), "utf8") || "{}").main || "index.js"))) : require;

requireCore("@teeny-tiny/dotenv").config();
const updateStatus = require("./trackers/status.js");
const updateStatistics = require("./trackers/statistics.js");
const fs = require("fs");
const { REST, Routes, Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } = requireCore("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const SyncStore = requireCore("syncstore.json");
const db = new SyncStore("./store.json");
const PERMISSIONS = require("./data/permissions.json");
let config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ], // --> remember to activate intents in the developer portal settings too!
});

client.once("ready", () => {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

  fs.writeFileSync("./channels/invite.txt", `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot${(config.slashCommands) ? "+applications.commands" : ""}&permissions=${Array.from(new Set([
    ...[
      "VIEW_CHANNEL",
      "SEND_MESSAGES"
    ],
    ...fs.readdirSync("./commands").map((command) => require("./commands/" + command)).filter(({ permissions }) => permissions).map(({ permissions }) => permissions),
    ...fs.readdirSync("./events").map((event) => require("./events/" + event)).filter(({ permissions }) => permissions).map(({ permissions }) => permissions),
  ].flat())).reduce((accumulator, permission) => accumulator | PERMISSIONS[permission], 0).toString()}`, "utf8");

  const lines = [
    `🤖  ${client.user.username} is online!`,
    `🚀  Ready to serve your server!`,
    `🔗  Invite Link:`,
    fs.readFileSync("./channels/invite.txt", "utf8") || ""
  ];

  const boxWidth = Math.max(...lines.map(line => line.length)) + 4;
  const horizontal = "═".repeat(boxWidth);

  const hasEmoji = (text) => {
    const emojiRegex = /(?:\p{Emoji}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Emoji})*)/gu;
    const numberOrSpecialCharRegex = /^[0-9]$|[.*+?^${}()|[\]\\]/;
    return Array.from(text).map((character) => emojiRegex.test(character) && !numberOrSpecialCharRegex.test(character)).includes(true);
  };

  const center = (text) => {
    const totalPadding = boxWidth - text.length;
    const left = Math.ceil(totalPadding / 2);
    const right = Math.floor(totalPadding / 2);
    return "║" + " ".repeat(left) + text + " ".repeat(right + Number(hasEmoji(text))) + "║";
  };

  console.log("\x1b[38;2;108;160;220m", `
╔${horizontal}╗
${lines.map(center).join('\n')}
╚${horizontal}╝`, "\x1b[0m");

  updateStatus("online");
  updateStatistics(client);

  client.user.setPresence({
    status: PresenceUpdateStatus[config?.status?.[0] || "Online"],
    activities: [
      {
        type: ActivityType[config?.status?.[1]],
        name: config?.status?.[2].replace(/\{(.*?)\}/g, (_, expression) => eval(expression))
      }
    ]
  });

  rest.put(
    Routes.applicationCommands(client.user.id),
    { body: (config.slashCommands ?? true) ? fs.readdirSync("./commands").map((command) => [command.substring(0, command.length - 3), require("./commands/" + command)]).filter(([_, { slashCommand }]) => slashCommand).map(([name, { description, slashCommand }]) => slashCommand.setName(name).setDescription(description || "")) : [] }
  );

  fs.watch("./config.json", (eventType) => {
    if (eventType !== "change") return;

    let previousConfig = config;

    config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

    if (JSON.stringify(config.status) !== JSON.stringify(previousConfig.status)) {
      try {
        client.user.setPresence({
          status: PresenceUpdateStatus[config?.status?.[0] || "Online"],
          activities: [
            {
              type: ActivityType[config?.status?.[1]],
              name: config?.status?.[2].replace(/\{(.*?)\}/g, (_, expression) => eval(expression))
            }
          ]
        });
      } catch {};
    };

    if (config.slashCommands !== previousConfig.slashCommands) {
      fs.readdirSync("./commands").forEach((command) => {
        delete require.cache[require.resolve("./bots/" + command)];
      });

      rest.put(
        Routes.applicationCommands(client.user.id),
        { body: (config.slashCommands ?? true) ? fs.readdirSync("./commands").map((command) => [command.substring(0, command.length - 3), require("./commands/" + command)]).filter(([_, { slashCommand }]) => slashCommand).map(([name, { description, slashCommand }]) => slashCommand.setName(name).setDescription(description || "")) : [] }
      );
    };
  });
});

client.on("messageCreate", (message) => {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");
  if (message.author.bot || !message.content.startsWith(db[message.guild.id]?.prefix || config.prefix)) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring((db[message.guild.id]?.prefix || config.prefix).length).split(" ")[0];

  if (fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    delete require.cache[require.resolve(`./commands/${commandName}.js`)];
    const commandFile = require(`./commands/${commandName}.js`);

    message.respond = (...args) => {
      try {
        return message.channel.send(...args);
      } catch {};
    };

    if (!db[message.guild.id]) (db[message.guild.id] = {});
    message.store = db[message.guild.id];

    commandFile.command({
      ...{
        footer: config.footer.replace(/\{(.*?)\}/g, (_, expression) => eval(expression))
      },
      ...Object.fromEntries(Object.entries(commandFile.variables || {}).map(([variableName, { default: defaultValue = null } = {}] = []) => [
        variableName,
        config?.variables?.commands?.[commandName]?.[variableName] ?? defaultValue
      ]))
    }, client, message);

    if ((db[message.guild.id].constructor === Object) && !Object.keys(db[message.guild.id]).length) delete db[message.guild.id];

    fs.writeFileSync("./channels/messages.txt", (Number(fs.readFileSync("./channels/messages.txt", "utf8") || "0") + 1).toString(), "utf8");

    const commands = fs.readFileSync("./channels/commands.txt", "utf8").split("\n").filter((line) => line).map((line) => {
      const [key, value] = line.split(":").map((part) => part.trim());
      return [key.toLowerCase(), Number(value)];
    });
    const commandCount = commands.find(([key]) => key === commandName)?.[1] || 0;
    const updatedCommands = commands.filter(([key]) => key !== commandName).concat([[commandName, commandCount + 1]]);
    fs.writeFileSync("./channels/commands.txt", updatedCommands.map(([key, value]) => `${key}: ${value}`).join("\n"), "utf8");
  };
});

client.on("interactionCreate", (interaction) => {
  if (interaction.user.bot) return;

  config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

  let commandName = interaction.commandName;

  if (fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    delete require.cache[require.resolve(`./commands/${commandName}.js`)];
    const commandFile = require(`./commands/${commandName}.js`);
    
    interaction.respond = (...args) => {
      try {
        return interaction.reply(...args);
      } catch {};
    };

    if (!db[interaction.guild.id]) (db[interaction.guild.id] = {});
    interaction.store = db[interaction.guild.id];

    commandFile.command({
      ...{
        footer: config.footer.replace(/\{(.*?)\}/g, (_, expression) => eval(expression))
      },
      ...Object.fromEntries(Object.entries(commandFile.variables || {}).map(([variableName, { default: defaultValue = null } = {}] = []) => [
        variableName,
        config?.variables?.commands?.[commandName]?.[variableName] ?? defaultValue
      ]))
    }, client, interaction);

    if ((db[interaction.guild.id].constructor === Object) && !Object.keys(db[interaction.guild.id]).length) delete db[interaction.guild.id];

    fs.writeFileSync("./channels/messages.txt", (Number(fs.readFileSync("./channels/messages.txt", "utf8") || "0") + 1).toString(), "utf8");

    const commands = fs.readFileSync("./channels/commands.txt", "utf8").split("\n").filter((line) => line).map((line) => {
      const [key, value] = line.split(":").map((part) => part.trim());
      return [key.toLowerCase(), Number(value)];
    });
    const commandCount = commands.find(([key]) => key === commandName)?.[1] || 0;
    const updatedCommands = commands.filter(([key]) => key !== commandName).concat([[commandName, commandCount + 1]]);
    fs.writeFileSync("./channels/commands.txt", updatedCommands.map(([key, value]) => `${key}: ${value}`).join("\n"), "utf8");
  };
});

client.on("guildCreate", () => updateStatistics(client));
client.on("guildMemberAdd", () => updateStatistics(client));

fs.readdirSync("./events").forEach((event) => {
  if (!event.endsWith(".js")) return;
  client.on(event.substring(0, event.length - 3).replace(/[^A-Za-z]/g, ""), (...args) => {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

    delete require.cache[require.resolve(`./events/${event}`)];
    const eventFile = require(`./events/${event}`);

    eventFile.event({
      ...{
        footer: config.footer
      },
      ...Object.entries(eventFile.variables || {}).map(([variableName]) => [
        variableName,
        config?.variables?.events?.[event]?.[variableName] || null
      ]).reduce((accumulator, [variableName, variableValue]) => ({
        ...accumulator,
        ...{
          [variableName]: variableValue
        }
      }), {})
    }, client, ...args);

    const events = fs.readFileSync("./channels/events.txt", "utf8").split("\n").filter((line) => line).map((line) => {
      const [key, value] = line.split(":").map((part) => part.trim());
      return [key.toLowerCase(), Number(value)];
    });
    const eventCount = events.find(([key]) => key === event.substring(0, event.length - 3))?.[1] || 0;
    const updatedEvents = events.filter(([key]) => key !== event.substring(0, event.length - 3)).concat([[event.substring(0, event.length - 3), eventCount + 1]]);
    fs.writeFileSync("./channels/events.txt", updatedEvents.map(([key, value]) => `${key}: ${value}`).join("\n"), "utf8");
  });
});

client.login(process.env.TOKEN);