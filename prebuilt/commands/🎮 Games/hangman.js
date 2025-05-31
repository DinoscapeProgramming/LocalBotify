if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Play a game of Hangman.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    words: {
      type: "textarea",
      title: "Word List",
      description: "List of possible words to guess, one per line.",
      default: `apple
table
beach
cloud
house
grape
dream
chair
brush
smile
water
grass
toast
pizza
light
spoon
tiger
dress
panda
green
balloon
dolphin
monster
blanket
tornado
picture
airport
bicycle
library
thunder
diamond
gravity
popcorn
cabinet
lantern
printer
basketball
spaceship
microscope
caterpillar
dictionary
motorcycle
university
earthquake
binoculars
astronaut
flashlight
blueberry
quizzical
xylophone
labyrinth
zeppelin
juxtapose
rhubarb
knapsack
mnemonic
pharaoh
whizzing
cryptic
zucchini
awkward
buzzword
fjord
nugget
wizard
jellyfish
bubble
sloth
volcano
hammock
waffle
robot
karate
pickle
zombie
unicorn
ninja
pirate
cookie
orbit
sneeze`
    },
    maxGuesses: {
      type: "number",
      title: "Maximum Incorrect Guesses",
      description: "How many wrong guesses are allowed before game over.",
      default: 11
    },
    embedTitle: {
      type: "text",
      title: "Embed Title",
      default: "🎯  Hangman Game"
    },
    startMessage: {
      type: "textarea",
      title: "Start Message",
      default: "I've picked a word. Guess one letter at a time!"
    },
    winMessage: {
      type: "textarea",
      title: "Win Message",
      default: "🎉 You guessed the word **{word}** in **{attempts}** guesses!"
    },
    loseMessage: {
      type: "textarea",
      title: "Lose Message",
      default: "💀 You lost! The word was **{word}**."
    },
    invalidInput: {
      type: "textarea",
      title: "Invalid Input Message",
      default: "❌ Please guess a single, unused letter (A-Z)."
    },
    alreadyGuessed: {
      type: "textarea",
      title: "Already Guessed Message",
      default: "⚠️ You've already guessed **{letter}**."
    },
    timeoutMessage: {
      type: "textarea",
      title: "Timeout Message",
      default: "⏱️ Game timed out! The word was **{word}**."
    },
    embedColor: {
      type: "color",
      title: "Embed Color",
      default: "#ff6600"
    },
    footer: {
      type: "text",
      title: "Embed Footer",
      default: "Hangman | LocalBotify"
    },
    timeoutSeconds: {
      type: "number",
      title: "Timeout Seconds",
      default: 60
    }
  },

  command: async (vars, client, event) => {
    const {
      words, maxGuesses, embedTitle, startMessage, winMessage, loseMessage,
      invalidInput, alreadyGuessed, timeoutMessage, embedColor, footer, timeoutSeconds
    } = vars;

    const wordList = words
      .split(/\r?\n/)
      .map(w => w.trim().toLowerCase())
      .filter(w => /^[a-z]{3,}$/.test(w));

    if (!wordList.length) return event.respond("⚠️ No valid words configured.");

    const word = wordList[Math.floor(Math.random() * wordList.length)];
    const guessed = new Set();
    const correct = new Set();
    const wordLetters = new Set(word.split(""));
    let attempts = 0;

    const displayWord = () => word.split("").map(l => guessed.has(l) ? l : "⬜").join(" ");

    const sendGameEmbed = (desc) => {
      return event.respond({
        embeds: [new Discord.EmbedBuilder()
          .setColor(embedColor)
          .setTitle(embedTitle)
          .setDescription(desc)
          .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
          .setTimestamp()
        ]
      });
    };

    await sendGameEmbed(`${startMessage}\n\n\`${displayWord()}\`\nWrong guesses: 0/${maxGuesses}`);

    const filter = (m) => {
      const userId = (commandType(event) === "message") ? event.author.id : event.user.id;
      return m.author.id === userId && /^[a-zA-Z]$/.test(m.content.trim());
    };

    const channel = (commandType(event) === "message") ? event.channel : event.channel;

    try {
      while (attempts < maxGuesses) {
        const collected = await channel.awaitMessages({
          filter,
          max: 1,
          time: timeoutSeconds * 1000,
          errors: ["time"]
        });

        const msg = collected.first();
        const letter = msg.content.toLowerCase();

        if (guessed.has(letter)) {
          await msg.reply(alreadyGuessed.replace("{letter}", letter));
          continue;
        }

        guessed.add(letter);

        if (wordLetters.has(letter)) {
          correct.add(letter);
        } else {
          attempts++;
        }

        const progress = displayWord();

        if (Array.from(wordLetters).every(l => guessed.has(l))) {
          await sendGameEmbed(winMessage
            .replace("{word}", word)
            .replace("{attempts}", guessed.size));
          return;
        }

        await sendGameEmbed(`\`${progress}\`\nWrong guesses: ${attempts}/${maxGuesses}`);
      }

      await sendGameEmbed(loseMessage.replace("{word}", word));

    } catch {
      await sendGameEmbed(timeoutMessage.replace("{word}", word));
    }
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};