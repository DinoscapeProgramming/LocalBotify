const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { alert, prompt } = requireCore("localbotify");

module.exports = () => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync("./.env", "utf8");

    if (!fileContent.startsWith("- ENCRYPTED -\n")) return resolve(fileContent);

    prompt("Decrypt Environment", "Enter password...").then((password) => {
      const encryptedData = fileContent.replace("- ENCRYPTED -\n", "");

      const ivHex = encryptedData.slice(0, 24);
      const authTagHex = encryptedData.slice(24, 56);
      const ciphertextHex = encryptedData.slice(56);

      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const ciphertext = Buffer.from(ciphertextHex, "hex");

      crypto.scrypt(password, "salt", 32, (err, key) => {
        if (err) return resolve(fileContent);

        try {
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(authTag);

          let decrypted = decipher.update(ciphertext, "hex", "utf8");
          decrypted += decipher.final("utf8");

          resolve(decrypted);
        } catch {
          alert("⚠️ Invalid Password", "We couldn't decrypt your dotenv file since you entered an invalid password.");

          const lines = [
            "🔴   Process exiting with code 1"
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

          fs.writeFileSync(path.join(process.cwd(), "channels/status.txt"), "OFFLINE", "utf8");
          fs.writeFileSync(path.join(process.cwd(), "channels/process.txt"), "OFFLINE", "utf8");

          process.exit(1);
        };
      });
    });
  });
};