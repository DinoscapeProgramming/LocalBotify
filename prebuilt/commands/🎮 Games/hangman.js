if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Play a game of Hangman.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "Regular message above the embed.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed message.",
      default: "🎯  Hangman Game"
    },

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

    timeoutSeconds: {
      type: "number",
      title: "Timeout Seconds",
      default: 60
    }
  },

  command: async ({
    content,
    title,
    words,
    maxGuesses,
    startMessage,
    winMessage,
    loseMessage,
    alreadyGuessed,
    timeoutMessage,
    timeoutSeconds,
    footer,
  }, client, event) => {
    const wordList = words
      .split(/\r?\n/)
      .map(w => w.trim().toLowerCase())
      .filter(w => /^[a-z]{3,}$/.test(w));

    if (!wordList.length) return event.reject("⚠️ No valid words configured.");

    const word = wordList[Math.floor(Math.random() * wordList.length)];
    const guessed = new Set();
    const correct = new Set();
    const wordLetters = new Set(word.split(""));
    let attempts = 0;

    const displayWord = () => word.split("").map(l => guessed.has(l) ? l : "⬜").join(" ");

    const sendGameEmbed = (description) => {
      return event.respond({
        content,
        embeds: [
          new EmbedBuilder()
            .setColor(0x00bfff)
            .setTitle(title || null)
            .setDescription(description || null)
            .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
            .setTimestamp()
        ]
      });
    };

    await sendGameEmbed(`${startMessage}\n\n\`${displayWord()}\`\nWrong guesses: 0/${maxGuesses}`);

    const filter = (m) => {
      const userId = (commandType(event) === "message") ? event.author.id : event.user.id;
      return (m.author.id === userId) && /^[a-zA-Z]$/.test(m.content.trim());
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
          await msg.reply({
            content: null,
            embeds: [
              new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle(title || null)
                .setDescription(alreadyGuessed.replaceAll("{letter}", letter) || null)
                .setFooter({ text: footer, iconURL: msg.author.displayAvatarURL() })
                .setTimestamp()
            ]
          });
          continue;
        };

        guessed.add(letter);

        if (wordLetters.has(letter)) {
          correct.add(letter);
        } else {
          attempts++;
        };

        const progress = displayWord();

        if (Array.from(wordLetters).every(l => guessed.has(l))) {
          await sendGameEmbed(winMessage
            .replaceAll("{word}", word)
            .replaceAll("{attempts}", guessed.size));
          return;
        };

        await sendGameEmbed(`\`${progress}\`\nWrong guesses: ${attempts}/${maxGuesses}`);
      };

      await sendGameEmbed(loseMessage.replaceAll("{word}", word));

    } catch {
      await sendGameEmbed(timeoutMessage.replaceAll("{word}", word));
    };
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};