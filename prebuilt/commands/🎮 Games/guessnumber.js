if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Play a number guessing game with the bot.",

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
      description: "Title used for all embeds.",
      default: "🔢  Guess the Number"
    },

    minNumber: {
      type: "number",
      title: "Minimum Number",
      description: "The minimum number in the range.",
      default: 1
    },

    maxNumber: {
      type: "number",
      title: "Maximum Number",
      description: "The maximum number in the range.",
      default: 100
    },

    maxAttempts: {
      type: "number",
      title: "Maximum Attempts",
      description: "Maximum number of guesses allowed.",
      default: 999
    },

    timeoutSeconds: {
      type: "number",
      title: "Timeout (seconds)",
      description: "Seconds before the game times out waiting for guesses.",
      default: 60
    },

    startMessage: {
      type: "textarea",
      title: "Start Message",
      description: "Message sent when the game starts. Use {min} and {max} placeholders.",
      default: "I have picked a number between {min} and {max}. Try to guess it!"
    },

    tooLowMessage: {
      type: "textarea",
      title: "Too Low Message",
      description: "Message when guess is too low. Use {guess} placeholder.",
      default: "🔻 Your guess **{guess}** is too low."
    },

    tooHighMessage: {
      type: "textarea",
      title: "Too High Message",
      description: "Message when guess is too high. Use {guess} placeholder.",
      default: "🔺 Your guess **{guess}** is too high."
    },

    winMessage: {
      type: "textarea",
      title: "Win Message",
      description: "Message when user guesses correctly. Use {guess} and {attempts} placeholders.",
      default: "🎉 Correct! The number was **{guess}**. You guessed it in **{attempts}** tries."
    },

    loseMessage: {
      type: "textarea",
      title: "Lose Message",
      description: "Message when user fails to guess in max attempts or timeout.",
      default: "😞 You've run out of attempts! Better luck next time."
    },

    invalidateGuesses: {
      type: "switch",
      title: "Invalidate Guesses",
      description: "Send a message when the guess is not a valid number within the range.",
      default: false
    },

    invalidGuessMessage: {
      type: "textarea",
      title: "Invalid Guess Message",
      description: "Message when input is not a valid number within the range.",
      default: "⚠️ Please guess a valid number between {min} and {max}."
    },

    timeoutMessage: {
      type: "textarea",
      title: "Timeout Message",
      description: "Message when the game times out.",
      default: "⏰ Time's up! The number was **{number}**."
    }
  },

  command: async ({
    content,
    title,
    minNumber,
    maxNumber,
    maxAttempts,
    timeoutSeconds,
    startMessage,
    tooLowMessage,
    tooHighMessage,
    winMessage,
    loseMessage,
    invalidateGuesses,
    invalidGuessMessage,
    timeoutMessage,
    footer
  }, client, event) => {
    const min = Math.floor(minNumber);
    const max = Math.floor(maxNumber);

    if (min >= max) {
      return event.reject("⚠️ Invalid range configuration. Minimum must be less than maximum.");
    };

    const target = Math.floor(Math.random() * (max - min + 1)) + min;
    let attempts = 0;

    const sendEmbed = (description) => {
      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title || null)
        .setDescription(description || null)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();
      return event.respond({ content, embeds: [embed] });
    };

    await sendEmbed(startMessage.replaceAll("{min}", min).replaceAll("{max}", max));

    const filter = (m) => {
      if (m.id === event.id) return false;

      return !m.author.bot;
    };

    const channel = (commandType(event) === "message") ? event.channel : event.channel;

    try {
      while (attempts < maxAttempts) {
        const collected = await channel.awaitMessages({
          filter,
          max: 1,
          time: timeoutSeconds * 1000,
          errors: ["time"]
        });

        const guessMsg = collected.first();
        const guess = parseInt(guessMsg.content, 10);

        if (isNaN(guess) || guess < min || guess > max) {
          if (invalidateGuesses) await guessMsg.reply({ embeds: [
            new EmbedBuilder()
              .setColor(0x00bfff)
              .setTitle(title || null)
              .setDescription(invalidGuessMessage.replaceAll("{min}", min).replaceAll("{max}", max) || null)
              .setFooter({ text: footer, iconURL: guessMsg.author.displayAvatarURL() })
              .setTimestamp()
            ]
          });
          continue;
        };

        attempts++;

        if (guess === target) {
          await guessMsg.reply({ embeds: [
            new EmbedBuilder()
              .setColor(0x00bfff)
              .setTitle(title || null)
              .setDescription(winMessage.replaceAll("{guess}", guess).replaceAll("{attempts}", attempts) || null)
              .setFooter({ text: footer, iconURL: guessMsg.author.displayAvatarURL() })
              .setTimestamp()
            ]
          });
          return;
        } else if (guess < target) {
          await guessMsg.reply({ embeds: [
            new EmbedBuilder()
              .setColor(0x00bfff)
              .setTitle(title || null)
              .setDescription(tooLowMessage.replaceAll("{guess}", guess) || null)
              .setFooter({ text: footer, iconURL: guessMsg.author.displayAvatarURL() })
              .setTimestamp()
            ]
          });
        } else {
          await guessMsg.reply({ embeds: [
            new EmbedBuilder()
              .setColor(0x00bfff)
              .setTitle(title || null)
              .setDescription(tooHighMessage.replaceAll("{guess}", guess) || null)
              .setFooter({ text: footer, iconURL: guessMsg.author.displayAvatarURL() })
              .setTimestamp()
            ]
          });
        };
      };

      await sendEmbed(loseMessage);
    } catch {
      await sendEmbed(timeoutMessage.replaceAll("{number}", target));
    };
  },

  slashCommand: (SlashCommandBuilder) ? new SlashCommandBuilder() : null
};