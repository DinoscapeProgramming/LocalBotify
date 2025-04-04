const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  fs.writeFileSync(path.join(process.cwd(), "statistics.txt"), "Servers: " + client.guilds.cache.size.toString() + "\nUsers: " + client.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, 0).toString(), "utf8");
};