if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

const emojis = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️"
};

module.exports = {
  description: "Play Rock-Paper-Scissors against another user.",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    timeoutSeconds: {
      type: "number",
      title: "Timeout (seconds)",
      description: "How many seconds to wait for both players to pick",
      default: 30
    },

    embedTitleStart: {
      type: "text",
      title: "Embed Title - Start",
      description: "Title for the initial challenge embed",
      default: "🪨📄✂️  Rock-Paper-Scissors"
    },

    embedDescriptionStart: {
      type: "textarea",
      title: "Embed Description - Start",
      description: "Description for the initial challenge embed, use {player1} and {player2} as placeholders",
      default: "{player1} has challenged {player2}!\n\nBoth players, please pick your choice by clicking one of the buttons below."
    },

    embedTitleResult: {
      type: "text",
      title: "Embed Title - Result",
      description: "Title for the result embed",
      default: "🪨📄✂️  Rock-Paper-Scissors Result"
    },

    resultTieText: {
      type: "textarea",
      title: "Result Text - Tie",
      description: "Text shown when the game is a tie. Use {choice} and {emoji} as placeholders",
      default: "It's a tie! Both chose **{choice}** {emoji}"
    },

    resultWinText: {
      type: "textarea",
      title: "Result Text - Win",
      description: "Text shown when a player wins. Use {winner}, {winnerChoice}, {winnerEmoji}, {loserChoice}, and {loserEmoji} as placeholders",
      default: "{winner} wins! **{winnerChoice}** {winnerEmoji} beats **{loserChoice}** {loserEmoji}"
    },

    errorNotMentioned: {
      type: "text",
      title: "Error Message - No Opponent",
      description: "Message shown if no opponent was mentioned",
      default: "⚠️ You need to mention a user to challenge."
    },

    errorSelfChallenge: {
      type: "text",
      title: "Error Message - Self Challenge",
      description: "Message shown if user tries to challenge themselves",
      default: "⚠️ You cannot play against yourself!"
    },

    errorAlreadyPicked: {
      type: "text",
      title: "Error Message - Already Picked",
      description: "Message shown if a player tries to pick more than once",
      default: "⚠️ You already made your choice!"
    },

    errorTimeout: {
      type: "text",
      title: "Error Message - Timeout",
      description: "Message shown if game times out waiting for picks",
      default: "⏰ Game timed out. Both players did not pick in time."
    },

    errorMissingPick: {
      type: "text",
      title: "Error Message - Missing Pick",
      description: "Message shown if something went wrong and one or both picks are missing",
      default: "❌ Something went wrong. One or both players didn't pick."
    },

    footer: {
      type: "text",
      title: "Embed Footer Text",
      description: "The footer text shown on embeds",
      default: "Rock-Paper-Scissors | LocalBotify"
    },

    buttonRockLabel: {
      type: "text",
      title: "Button Label - Rock",
      description: "Label for the rock button",
      default: "Rock"
    },

    buttonPaperLabel: {
      type: "text",
      title: "Button Label - Paper",
      description: "Label for the paper button",
      default: "Paper"
    },

    buttonScissorsLabel: {
      type: "text",
      title: "Button Label - Scissors",
      description: "Label for the scissors button",
      default: "Scissors"
    }
  },

  command: async (variables, client, event) => {
    const { timeoutSeconds, embedTitleStart, embedDescriptionStart, embedTitleResult, resultTieText, resultWinText,
      errorNotMentioned, errorSelfChallenge, errorAlreadyPicked, errorTimeout, errorMissingPick, footer,
      buttonRockLabel, buttonPaperLabel, buttonScissorsLabel } = variables;

    let challenger, challenged;
    if (commandType(event) === "message") {
      challenger = event.author;
      challenged = event.mentions.users.first();
    } else {
      challenger = event.user;
      challenged = event.options.getUser("user");
    };

    if (!challenged) return event.respond(errorNotMentioned);
    if (challenged.id === challenger.id) return event.respond(errorSelfChallenge);

    const startDescription = embedDescriptionStart
      .replace("{player1}", `<@${challenger.id}>`)
      .replace("{player2}", `<@${challenged.id}>`);

    const buttons = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("rps_rock")
        .setLabel(buttonRockLabel)
        .setStyle(Discord.ButtonStyle.Primary)
        .setEmoji(emojis.rock),
      new Discord.ButtonBuilder()
        .setCustomId("rps_paper")
        .setLabel(buttonPaperLabel)
        .setStyle(Discord.ButtonStyle.Primary)
        .setEmoji(emojis.paper),
      new Discord.ButtonBuilder()
        .setCustomId("rps_scissors")
        .setLabel(buttonScissorsLabel)
        .setStyle(Discord.ButtonStyle.Primary)
        .setEmoji(emojis.scissors)
    );

    const challengeEmbed = new Discord.EmbedBuilder()
      .setTitle(embedTitleStart)
      .setDescription(startDescription)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? challenger : challenger).displayAvatarURL() })
      .setTimestamp();

    const challengeMessage = await event.respond({
      embeds: [challengeEmbed],
      components: [buttons],
      fetchReply: true
    });

    const picks = new Map();

    const bothPicked = () => picks.has(challenger.id) && picks.has(challenged.id);

    const filter = (interaction) => {
      if (!["rps_rock", "rps_paper", "rps_scissors"].includes(interaction.customId)) return false;
      if (interaction.user.id !== challenger.id && interaction.user.id !== challenged.id) return false;
      return true;
    };

    const collector = challengeMessage.createMessageComponentCollector({ filter, time: timeoutSeconds * 1000 });

    collector.on("collect", async (interaction) => {
      const playerId = interaction.user.id;

      if (picks.has(playerId)) {
        await interaction.reply({ content: errorAlreadyPicked, ephemeral: true });
        return;
      };

      const choice = interaction.customId.split("_")[1];
      picks.set(playerId, choice);

      await interaction.reply({ content: `You selected **${choice}** ${emojis[choice]}`, ephemeral: true });

      if (bothPicked()) {
        collector.stop("completed");
      };
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "completed") {
        await challengeMessage.edit({ components: [] });
        return event.respond(errorTimeout);
      };

      const p1Choice = picks.get(challenger.id);
      const p2Choice = picks.get(challenged.id);

      if (!p1Choice || !p2Choice) {
        await challengeMessage.edit({ components: [] });
        return event.respond(errorMissingPick);
      };

      let resultText;
      if (p1Choice === p2Choice) {
        resultText = resultTieText
          .replace("{choice}", p1Choice)
          .replace("{emoji}", emojis[p1Choice]);
      } else {
        const winsAgainst = {
          rock: "scissors",
          paper: "rock",
          scissors: "paper"
        };

        let winner, winnerChoice, loserChoice;

        if (winsAgainst[p1Choice] === p2Choice) {
          winner = challenger;
          winnerChoice = p1Choice;
          loserChoice = p2Choice;
        } else {
          winner = challenged;
          winnerChoice = p2Choice;
          loserChoice = p1Choice;
        };

        resultText = resultWinText
          .replace("{winner}", `<@${winner.id}>`)
          .replace("{winnerChoice}", winnerChoice)
          .replace("{winnerEmoji}", emojis[winnerChoice])
          .replace("{loserChoice}", loserChoice)
          .replace("{loserEmoji}", emojis[loserChoice]);
      };

      await challengeMessage.edit({ components: [] });

      const resultEmbed = new Discord.EmbedBuilder()
        .setTitle(embedTitleResult)
        .setDescription(resultText)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? challenger : challenger).displayAvatarURL() })
        .setTimestamp();

      event.respond({ embeds: [resultEmbed] });
    });
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to challenge")
          .setRequired(true)
      )
  ) : null
};