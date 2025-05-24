if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const nodeFetch = (...args) => importCore("node-fetch").then(({ default: fetch }) => fetch(...args));

if (!global.server) (global.server = {});
if (!global.server.link) (global.server.link = null);
if (!global.server.password) (global.server.password = null);
if (!global.server.eventEmitter) (global.server.eventEmitter = null);
if (!global.server.users) (global.server.users = []);

(async () => {
  await new Promise((resolve, reject) => {
    if (global.server.link || global.server.eventEmitter) return resolve();

    const http = require("http");
    const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>LocalBotify AI</title>
          <script defer src="https://js.puter.com/v2"></script>
          <script defer src="/socket.io/socket.io.js"></script>
          <script defer>
            function waitForLibraries(callback) {
              if ((typeof puter !== "undefined") && (typeof io !== "undefined")) {
                callback();
              } else {
                setTimeout(() => waitForLibraries(callback), 50);
              };
            };

            waitForLibraries(() => {
              const socket = io("/");

              socket.emit("connectAgent", (new URL(location.href)).searchParams.get("user") || "");

              socket.on("sendData", (data) => {
                if (typeof data !== "string") return;

                puter.ai.chat(data).then(({ message } = {}) => {
                  if (!message.content) return;

                  socket.emit("dataReady", message.content);
                });
              });
            });
          </script>
        </head>
        <body>
          Please keep this page open to keep the AI running. If you close it, the AI will stop working.
        </body>
      </html>
    `);
    });
    const EventEmitter = require("events");
    const eventEmitter = new EventEmitter();
    const localtunnel = requireCore("localtunnel");
    const io = requireCore("socket.io")(server, {
      cors: {
        origin: "*"
      }
    });

    io.on("connection", (socket, name) => {
      socket.on("connectAgent", (user) => {
        if (!user || (typeof user !== "string")) return;

        global.server.users.push(user);

        socket.on("dataReady", (data) => {
          eventEmitter.emit(`dataReady:${user}`, data);
        });

        eventEmitter.emit(`userConnected:${user}`);

        eventEmitter.removeAllListeners(`sendData:${user}`);
        eventEmitter.on(`sendData:${user}`, (data) => {
          socket.emit("sendData", data);
        });

        socket.on("disconnect", () => {
          global.server.users = global.server.users.filter((u) => u !== user);
        });
      });
    });

    server.listen(3000, "localhost", () => {
      localtunnel({ port: 3000 }).then((tunnel) => {
        global.server.link = tunnel.url;
        global.server.eventEmitter = eventEmitter;

        console.log(`Server running at ${tunnel.url}`);

        resolve();
      });
    });
  });

  global.server.password = await (await fetch("https://loca.lt/mytunnelpassword")).text();
})();

module.exports = {
  description: "Chat with our free AI agent",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    header: {
      title: "Header",
      description: "The header of the response embed",
      type: "text"
    }
  },

  command: async ({
    header,
    footer
  }, client, event) => {
    try {
      if (!global.server.users.includes((commandType(event) === "message") ? event.author.id : event.user.id)) {
        event.respond(`Please connect to the AI agent using the following link: ${(global.server.link) ? `${global.server.link}?user=${encodeURIComponent((commandType(event) === "message") ? event.author.id : event.user.id)}` : "Server not ready yet"}\nEnter the following password to connect: \`${global.server.password || "Server not ready yet"}\``);

        await new Promise((resolve, reject) => {
          global.server.eventEmitter.on(`userConnected:${(commandType(event) === "message") ? event.author.id : event.user.id}`, resolve);
        });
      };

      global.server.eventEmitter.removeAllListeners(`dataReady:${(commandType(event) === "message") ? event.author.id : event.user.id}`);
      global.server.eventEmitter.addListener(`dataReady:${(commandType(event) === "message") ? event.author.id : event.user.id}`, (data) => {
        if (typeof data !== "string") return;

        event.respond(data.substring(0, 2000));
      });

      global.server.eventEmitter.emit(`sendData:${(commandType(event) === "message") ? event.author.id : event.user.id}`, (commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ") : event.options.getString("prompt") || "");
    } catch {};
  },

  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .setName("chat")
    .addStringOption((option) =>
      option.setName("prompt")
        .setDescription("The prompt to send to the AI")
        .setRequired(true)
    )
  ) : null
};