const fs = require("fs");
const path = require("path");

function updateStatus(status) {
  fs.writeFileSync(path.join(process.cwd(), "status.txt"), status.toUpperCase(), "utf8");
};

process.on("exit", (code) => {
  updateStatus("offline");
  console.log(`Process exiting with code ${code}`);
});

// Handle Ctrl+C
process.on("SIGINT", () => {
  updateStatus("offline");
  process.exit(0);
});

// Handle kill command
process.on("SIGTERM", () => {
  updateStatus("offline");
  process.exit(0);
});

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  updateStatus("offline");
  process.exit(1);
});

updateStatus("online");