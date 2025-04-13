require("../../node_modules/@teeny-tiny/dotenv/index.js").config();
const fs = require("fs");
const { REST, Routes, Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } = require("../../node_modules/discord.js/src/index.js");
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const updateStatistics = require("./trackers/statistics.js");
let config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ], // --> remember to activate intents in developer portal settings too!
  rest: {
    requestTimeout: JSON.parse(fs.readFileSync("../../settings.json", "utf8") || "{}").apiTimeout || 5000
  }
});

client.once("ready", () => {
  console.log("Bot is Online!");

  require("./trackers/status.js");
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
      ...Object.entries(commandFile.variables).map(([variableName]) => [
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
  if (!event.endsWith(".js"))
  client.on(event.substring(0, event.length - 3).replace(/[^A-Za-z]/g, ""), (...args) => {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

    delete require.cache[require.resolve(`./commands/${event}.js`)];
    const eventFile = require(`./events/${event}`);

    eventFile.event({
      ...{
        footer: config.footer
      },
      ...Object.entries(eventFile.variables).map(([variableName]) => [
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