const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  fs.writeFileSync(path.join(process.cwd(), "channels/statistics.txt"), "Servers: " + client.guilds.cache.size.toString() + "\nUsers: " + Math.max(client.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, -1 * client.guilds.cache.size), 0).toString(), "utf8");
  
  const analytics = fs.readFileSync(path.join(process.cwd(), "channels/analytics.txt"), "utf8").trim();

  if ((analytics.split("\n")[0].split("-")[Math.floor(analytics.split("\n")[0].split("-").length / 2)].trim() === "v1") && ((analytics.split("\n").at(-2) !== client.guilds.cache.size.toString()) || (analytics.split("\n").at(-1) !== Math.max(client.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, -1 * client.guilds.cache.size), 0).toString()))) {
    fs.writeFileSync(path.join(process.cwd(), "channels/analytics.txt"), analytics + "\n" + Date.now().toString() + "\n" + client.guilds.cache.size.toString() + "\n" + Math.max(client.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, -1 * client.guilds.cache.size), 0).toString(), "utf8");
  } else if (!analytics) {
    fs.writeFileSync(path.join(process.cwd(), "channels/analytics.txt"), "- v1 -\n" + Date.now().toString() + "\n" + client.guilds.cache.size.toString() + "\n" + Math.max(client.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, -1 * client.guilds.cache.size), 0).toString(), "utf8");
  };
};