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
  console.log(`Process exiting with code ${code}`);
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
  if (err.message.includes("ENOTFOUND discord.com")) {
    alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");
  } else if (err.message.includes("An invalid token was provided.")) {
    alert("⚠️ Invalid Token", "Your bot token is invalid! Please provide a valid token.");
  } else if (err.message.includes("Used disallowed intents")) {
    alert("⚠️ Privileged Intents", "Privileged intents missing in Developer Portal! Please enable them.");
  } else {
    console.error("Uncaught exception:", err);
  };

  updateStatus("offline");
  updateProcress("offline");
  fs.writeFileSync(path.join(process.cwd(), "channels/error.txt"), Date.now().toString() + "\n" + err.toString().split(":").slice(1).join(":"), "utf8");
  process.exit(1);
});

updateProcress("online");

module.exports = updateStatus;