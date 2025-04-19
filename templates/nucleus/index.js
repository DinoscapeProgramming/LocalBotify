const updateStatus = require("./trackers/status.js");
const updateStatistics = require("./trackers/statistics.js");
const fs = require("fs");
const path = require("path");
require(`../../${fs.readdirSync(path.dirname(path.dirname(__dirname))).includes("LocalBotify.exe") ? "resources/app.asar.unpacked/" : ""}node_modules/@teeny-tiny/dotenv/index.js`).config();
const { REST, Routes, Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } = require(`../../${fs.readdirSync(path.dirname(path.dirname(__dirname))).includes("LocalBotify.exe") ? "resources/app.asar.unpacked/" : ""}node_modules/discord.js/src/index.js`);
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const PERMISSIONS = require("./data/permissions.json");
let config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ], // --> remember to activate intents in developer portal settings too!
});

client.once("ready", () => {
  fs.writeFileSync("./channels/invite.txt", `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot+applications.commands&permissions=${Array.from(new Set([
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
    { body: (config.slashCommands ?? true) ? fs.readdirSync("./commands").map((command) => require("./commands/" + command)).filter(({ slashCommand }) => slashCommand).map(({ slashCommand }) => slashCommand) : [] }
  );

  fs.watch("./config.json", (eventType) => {
    if (eventType !== "change") return;

    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

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
        { body: (config.slashCommands ?? true) ? fs.readdirSync("./commands").map((command) => require("./commands/" + command)).filter(({ slashCommand }) => slashCommand).map(({ slashCommand }) => slashCommand) : [] }
      );
    };
  });
});

client.on("messageCreate", (message) => {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  let command = message.content.toLowerCase();
  let commandName = command.substring(config.prefix.length);

  if (fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    delete require.cache[require.resolve(`./commands/${commandName}.js`)];
    const commandFile = require(`./commands/${commandName}.js`);

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
  };
});

client.on("interactionCreate", (interaction) => {
  if (interaction.user.bot) return;

  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

  let commandName = interaction.commandName;

  if (fs.readdirSync("./commands").includes(`${commandName}.js`)) {
    delete require.cache[require.resolve(`./commands/${commandName}.js`)];
    const commandFile = require(`./commands/${commandName}.js`);

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
  };
});

client.on("guildCreate", () => updateStatistics(client));
client.on("guildMemberAdd", () => updateStatistics(client));

fs.readdirSync("./events").forEach((event) => {
  if (!event.endsWith(".js")) return;
  client.on(event.substring(0, event.length - 3).replace(/[^A-Za-z]/g, ""), (...args) => {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

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
  });
});

client.login(process.env.TOKEN);