if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

const WORDS = [
  "visit", "toast", "zooms", "kneel", "reach", "joker", "drink", "enjoy", "flame", "hover",
  "giant", "maple", "brick", "zebra", "doubt", "claim", "grape", "field", "wheat", "stone",
  "heart", "yield", "ghost", "light", "mount", "score", "brain", "upper", "short", "youth",
  "blaze", "crane", "plane", "peace", "flint", "never", "catch", "lunch", "knock", "unity",
  "ocean", "speak", "queen", "paint", "thing", "angle", "river", "world", "value"
];

function checkGuess(word, guess) {
  return [...guess].map((char, i) => 
    char === word[i] ? "🟩" : word.includes(char) ? "🟨" : "⬛"
  ).join("");
}

module.exports = {
  description: "Start a Wordle game — guess the word in 6 tries!",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed message.",
      default: "🟩  Wordle"
    },
    startMessage: {
      type: "textarea",
      title: "Start Message",
      description: "Message shown when Wordle game begins.",
      default: "🎮 Wordle Game started! Reply with a 5-letter guess."
    },
    wrongLength: {
      type: "textarea",
      title: "Wrong Length Message",
      default: "❌ Your guess must be 5 letters."
    },
    color: {
      type: "color",
      title: "Embed Color",
      default: "#00bfff"
    }
  },

  command: async ({
    title,
    startMessage,
    wrongLength,
    footer
  }, client, event) => {
    const target = WORDS[Math.floor(Math.random() * WORDS.length)];
    const guesses = [];
    const maxGuesses = 6;

    const filter = (m) => 
      m.author.id === ((commandType(event) === "message") ? event.author.id : event.user.id) &&
      m.content.length === 5 && /^[a-zA-Z]+$/.test(m.content);

    const embed = new Discord.EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(startMessage || null)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

    const sent = await event.respond({ embeds: [embed] });

    const channel = event.channel ?? event.reply?.channel;
    const collector = channel.createMessageCollector({ filter, time: 60000 * 3 });

    collector.on("collect", async msg => {
      const guess = msg.content.toLowerCase();
      if (guess.length !== 5) return msg.reply(wrongLength);

      const result = checkGuess(target, guess);
      guesses.push({ guess, result });

      if (guess === target || guesses.length >= maxGuesses) {
        collector.stop("done");
      }

      const desc = guesses.map(g => `\`${g.guess}\` → ${g.result}`).join("\n");
      const done = (guess === target || guesses.length >= maxGuesses);

      embed.setDescription(desc + (done ? `\n\n✅ The word was: **${target}**` : ""));
      embed.setColor(done ? 0x00ff66 : 0x00bfff);
      sent.edit({ embeds: [embed] });
      msg.delete().catch(() => {});
    });

    collector.on("end", (_, reason) => {
      if (reason !== "done") {
        embed.setDescription(embed.data.description + `\n\n⌛ Time's up! The word was **${target}**`);
        embed.setColor(0xff3333);
        sent.edit({ embeds: [embed] });
      }
    });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};