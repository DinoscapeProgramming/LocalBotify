if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

if (!global.server) (global.server = {});
if (!global.server.link) (global.server.link = null);
if (!global.server.password) (global.server.password = null);
if (!global.server.eventEmitter) (global.server.eventEmitter = null);
if (!global.server.users) (global.server.users = []);
if (!global.server.messages) (global.server.messages = []);

(async () => {
  await new Promise((resolve, reject) => {
    if (global.server.link || global.server.eventEmitter || global.server.loading) return resolve();

    global.server.loading = true;

    const http = require("http");
    const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>LocalBotify - AI</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: linear-gradient(to right, #667eea, #764ba2);
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              color: #fff;
            }

            .container {
              background-color: rgba(255, 255, 255, 0.1);
              padding: 2rem 3rem;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
              text-align: center;
              max-width: 600px;
            }

            .container h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
            }

            .container p {
              font-size: 1.2rem;
              line-height: 1.6;
            }
          </style>
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

              socket.on("sendData", ({ type, data }) => {
                if (type === "chat") {
                  if (!Array.isArray(data)) return;

                  puter.ai.chat(data).then(({ message } = {}) => {
                    if (!message.content) return;

                    socket.emit("dataReady", {
                      type: "chat",
                      data: message.content
                    });
                  }).catch(() => {});
                } else if (type === "describe") {
                  if (!Array.isArray(data)) return;

                  puter.ai.chat("Describe this image." + ((data[1]) ? ("Here is some additional context: " + data[1]) : ""), data[0]).then(({ message } = {}) => {
                    if (!message.content) return;

                    socket.emit("dataReady", {
                      type: "describe",
                      data: message.content
                    });
                  }).catch(() => {});
                } else if (type === "image") {
                  if (typeof data !== "string") return;

                  puter.ai.txt2img(data).then((image) => {
                    if (!image || !image.src) return;

                    socket.emit("dataReady", {
                      type: "image",
                      data: image.src
                    });
                  }).catch(() => {});
                } else if (type === "tts") {
                  if (typeof data !== "string") return;

                  puter.ai.txt2speech(data).then((audio) => {
                    if (!audio || !audio.src) return;

                    socket.emit("dataReady", {
                      type: "tts",
                      data: audio.src
                    });
                  });
                };
              });
            });
          </script>
        </head>
        <body>
          <div class="container">
            <h1>🧠 AI is Running</h1>
            <p>Please keep this page open to keep the AI running.<br>If you close it, the AI will stop working.</p>
          </div>
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

        socket.on("dataReady", ({ type, data } = {}) => {
          eventEmitter.emit(`dataReady:${user}`, {
            type,
            data
          });
        });

        eventEmitter.emit(`userConnected:${user}`);

        eventEmitter.removeAllListeners(`sendData:${user}`);
        eventEmitter.on(`sendData:${user}`, ({ type, data } = {}) => {
          socket.emit("sendData", {
            type,
            data
          });
        });

        socket.on("disconnect", () => {
          global.server.users = global.server.users.filter((u) => u !== user);
        });
      });
    });

    server.listen(3000, "localhost", () => {
      let connect = () => {
        try {
          localtunnel({ port: 3000 }).then((tunnel) => {
            global.server.link = tunnel.url;
            global.server.eventEmitter = eventEmitter;

            console.log(`Server running at ${tunnel.url}`);

            resolve();
          }).catch(() => {
            setTimeout(connect, 0);
          });
        } catch {
          setTimeout(connect, 0);
        };
      };

      connect();
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
    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if the user does not specify a prompt.",
      default: "Please provide a prompt to send to the AI agent."
    },
    title: {
      type: "text",
      title: "Connection Title",
      description: "The title of the response embed when the user is not connected to the AI agent.",
      default: "🧠  Connect to AI Agent"
    },
    description: {
      type: "textarea",
      title: "Connection Description",
      description: "The description of the response embed when the user is not connected to the AI agent. Use \`${link}\` to insert the link to connect to the AI agent and \`${password}\` to insert the password.",
      default: `Please connect using the following link: \${link}\nEnter the following password to connect: \`\${password}\``
    }
  },

  command: async ({
    errorMessage,
    title,
    description,
    footer
  }, client, event) => {
    try {
      if ((commandType(event) === "message") && !event.content.split(" ").slice(1).join(" ").trim()) return event.respond({
        content: errorMessage
      });

      let connectionMessage = null;

      if (!global.server.users.includes((commandType(event) === "message") ? event.author.id : event.user.id)) {
        connectionMessage = event.respond({
          content: null,
          embeds: [
            new EmbedBuilder()
              .setColor(0x00bfff)
              .setTitle(title)
              .setDescription(description.replaceAll("${link}", (global.server.link) ? `${global.server.link}?user=${encodeURIComponent((commandType(event) === "message") ? event.author.id : event.user.id)}` : "`Server not ready yet`").replaceAll("${password}", global.server.password || "Server not ready yet"))
              .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
              .setTimestamp()
          ]
        });

        await new Promise((resolve, reject) => {
          global.server.eventEmitter.on(`userConnected:${(commandType(event) === "message") ? event.author.id : event.user.id}`, resolve);
        });
      };

      if (connectionMessage) {
        try {
          (await connectionMessage).delete().catch(() => {});
        } catch {};
      };

      let response = false;

      event.channel.sendTyping();

      let interval = setInterval(() => {
        try {
          if (!response || !global.server.users.includes((commandType(event) === "message") ? event.author.id : event.user.id)) return event.channel.sendTyping();
        } catch {};

        clearInterval(interval);
      }, 9500);

      global.server.eventEmitter.removeAllListeners(`dataReady:${(commandType(event) === "message") ? event.author.id : event.user.id}`);
      global.server.eventEmitter.addListener(`dataReady:${(commandType(event) === "message") ? event.author.id : event.user.id}`, ({ type, data } = {}) => {
        if ((type !== "image") || (typeof data !== "string")) return;

        response = true;

        event.respond({
          files: [
            new AttachmentBuilder(Buffer.from(data.split(",")[1], "base64"), { name: "image.png" })
          ]
        });
      });

      global.server.eventEmitter.emit(`sendData:${(commandType(event) === "message") ? event.author.id : event.user.id}`, {
        type: "image",
        data: ((commandType(event) === "message") ? event.content.split(" ").slice(1).join(" ").trim() : event.options.getString("prompt")) || ""
      });
    } catch {};
  },

  slashCommand: (SlashCommandBuilder) ? (new SlashCommandBuilder()
    .setName("image")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt to send to the AI")
        .setRequired(true)
    )
  ) : null
};