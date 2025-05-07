global.isLocalBotify = (require("path").basename(require("path").join(process.cwd(), "..")) === "bots");
global.isPackaged = (global.isLocalBotify) ? require("fs").existsSync(require("path").join(process.cwd(), "../../resources/app.asar.unpackaged/node_modules")) : null;
global.importCore = (global.isLocalBotify) ? ((module) => import(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, JSON.parse(require("fs").readFileSync(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, "package.json"), "utf8") || "{}").main || "index.js"))) : ((module) => import(module));
global.requireCore = (global.isLocalBotify) ? ((module) => require(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, JSON.parse(require("fs").readFileSync(require("path").join(process.cwd(), (global.isPackaged) ? "../../resources/app.asar.unpackaged/node_modules" : "../../node_modules", module, "package.json"), "utf8") || "{}").main || "index.js"))) : require;

const updateStatus = require("./trackers/status.js");
const updateStatistics = require("./trackers/statistics.js");
const fs = require("fs");
const path = require("path");
require(`../../${fs.readdirSync(path.dirname(path.dirname(__dirname))).includes("LocalBotify.exe") ? "resources/app.asar.unpacked/" : ""}node_modules/@teeny-tiny/dotenv/index.js`).config();
const { REST, Routes, Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } = require(`../../${fs.readdirSync(path.dirname(path.dirname(__dirname))).includes("LocalBotify.exe") ? "resources/app.asar.unpacked/" : ""}node_modules/discord.js/src/index.js`);
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const PERMISSIONS = require("./data/permissions.json");
let config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
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
  ].flat())).reduce((acc, permission) => acc | PERMISSIONS[permission], 0).toString()}`, "utf8");

  const lines = [
    `🤖 ${client.user.username} is online!`,
    `🚀 Ready to serve your server!`,
    `🔗 Invite Link:`,
    fs.readFileSync("./channels/invite.txt", "utf8")
  ];

  const boxWidth = Math.max(...lines.map(line => line.length)) + 4; // Padding
  const horizontal = '═'.repeat(boxWidth);

  const center = (text) => {
    const totalPadding = boxWidth - text.length;
    const left = Math.ceil(totalPadding / 2);
    const right = Math.floor(totalPadding / 2);
    return '║' + ' '.repeat(left) + text + ' '.repeat(right) + '║';
  };

  console.log('\x1b[36m%s\x1b[0m', `
╔${horizontal}╗
${lines.map(center).join('\n')}
╚${horizontal}╝
  `);

  updateStatus("online");
  updateStatistics(client);

  client.user.setStatus(PresenceUpdateStatus[config?.status?.[0] || "Online"]);
  if (config?.status?.[1]) client.user.setActivity(config?.status?.[2].replace(/\{(.*?)\}/g, (_, expression) => eval(expression)), ((config?.status?.[1] === "Playing")) ? {} : {
    type: ActivityType[config?.status?.[1]]
  });

  rest.put(
    Routes.applicationCommands(client.user.id),
    { body: (config.slashCommands ?? true) ? fs.readdirSync("./commands").map((command) => require("./commands/" + command)).filter(({ slashCommand }) => slashCommand).map(({ description, slashCommand }) => slashCommand.setDescription(description || "")) : [] }
  );

  fs.watch("./config.json", (eventType) => {
    if (eventType !== "change") return;

    config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");

    if (JSON.stringify(config.status) !== JSON.stringify(JSON.parse(fs.readFileSync("./config.json", "utf8")).status)) {
      client.user.setStatus(PresenceUpdateStatus[config?.status?.[0] || "Online"]);
      if (config?.status?.[1]) client.user.setActivity(config?.status?.[2].replace(/\{(.*?)\}/g, (_, expression) => eval(expression)), ((config?.status?.[1] === "Playing")) ? {} : {
        type: ActivityType[config?.status?.[1]]
      });
    };

    if (JSON.stringify(config.status) !== JSON.stringify(JSON.parse(fs.readFileSync("./config.json", "utf8")).status)) {
      fs.readdirSync("./commands").forEach((command) => {
        delete require.cache[require.resolve("./bots/" + command)];
      });

      rest.put(
        Routes.applicationCommands(client.user.id),
        { body: (config.slashCommands ?? true) ? fs.readdirSync("./commands").map((command) => require("./commands/" + command)).filter(({ slashCommand }) => slashCommand).map(({ description, slashCommand }) => slashCommand.setDescription(description || "")) : [] }
      );
    };
  });
});

client.on("messageCreate", (message) => {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8") || "{}");
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring(config.prefix.length);

  if (fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    delete require.cache[require.resolve(`./commands/${commandName}.js`)];
    const commandFile = require(`./commands/${commandName}.js`);

    message.respond = (...args) => message.channel.send(args);

    commandFile.command({
      ...{
        footer: config.footer.replace(/\{(.*?)\}/g, (_, expression) => eval(expression))
      },
      ...Object.entries(commandFile.variables).map(([variableName]) => [
        variableName,
        config?.variables?.commands?.[commandName]?.[variableName] || null
      ]).reduce((accumulator, [variableName, variableValue]) => ({
        ...accumulator,
        ...{
          [variableName]: variableValue
        }
      }), {})
    }, client, message);

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
    
    interaction.respond = (...args) => interaction.reply(args);

    commandFile.command({
      ...{
        footer: config.footer.replace(/\{(.*?)\}/g, (_, expression) => eval(expression))
      },
      ...Object.entries(commandFile.variables || {}).map(([variableName]) => [
        variableName,
        config?.variables?.commands?.[commandName]?.[variableName] || null
      ]).reduce((accumulator, [variableName, variableValue]) => ({
        ...accumulator,
        ...{
          [variableName]: variableValue
        }
      }), {})
    }, client, interaction);

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