const fs = require("fs");
const path = require("path");
const { alert } = requireCore("localbotify");

function updateStatus(status) {
  fs.writeFileSync(path.join(process.cwd(), "channels/status.txt"), status.toUpperCase(), "utf8");
};

function updateProcress(status) {
  fs.writeFileSync(path.join(process.cwd(), "channels/process.txt"), status.toUpperCase(), "utf8");
};

process.on("exit", (code) => {
  updateStatus("offline");
  updateProcress("offline");

  const lines = [
    `🔴   Process exiting with code ${code}`
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

  console.log("\x1b[38;2;230;70;70m%s\x1b[0m", `
╔${horizontal}╗
${lines.map(center).join('\n')}
╚${horizontal}╝`, "\x1b[0m");
});

// Handle Ctrl+C
process.on("SIGINT", () => {
  updateStatus("offline");
  updateProcress("offline");
  process.exit(0);
});

// Handle kill command
process.on("SIGTERM", () => {
  updateStatus("offline");
  updateProcress("offline");
  process.exit(0);
});

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  if ((err.message || err)?.includes("ENOTFOUND discord.com")) {
    alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");
  } else if ((err.message || err)?.includes("An invalid token was provided.")) {
    alert("⚠️ Invalid Token", "Your bot token is invalid! Please provide a valid token.");
  } else if ((err.message || err)?.includes("Used disallowed intents")) {
    alert("⚠️ Privileged Intents", "Privileged intents missing in Developer Portal! Please enable them.");
  } else if ((err.message || err)?.includes("(check your firewall settings)")) {
    alert("⚠️ Connection Refused", "The connection to the LocalTunnel server was refused! Please restart your bot.");
  } else {
    const lines = [
      ...[`🔴   Uncaught exception:`],
      ...(err.stack || err.message || err)?.split("\n") || []
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

    console.log("\x1b[38;2;230;70;70m%s\x1b[0m", `
╔${horizontal}╗
${lines.map(center).join('\n')}
╚${horizontal}╝`, "\x1b[0m");
  };

  updateStatus("offline");
  updateProcress("offline");
  fs.writeFileSync(path.join(process.cwd(), "channels/error.txt"), Date.now().toString() + "\n" + err.toString().split(":").slice(1).join(":"), "utf8");
  process.exit(1);
});

updateProcress("online");

module.exports = updateStatus;