if (!global.requireCore) (global.requireCore = () => ({}));

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
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
    content: {
      type: "textarea",
      title: "Content",
      description: "Regular message above the embed.",
      default: ""
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

    timeoutEnabled: {
      type: "switch",
      title: "Enable Timeout",
      description: "Whether to enable a timeout for the game",
      default: true
    },

    timeoutSeconds: {
      type: "number",
      title: "Timeout (seconds)",
      description: "How many seconds to wait for both players to pick",
      default: 30
    },

    timeoutMessage: {
      type: "text",
      title: "Timeout Message",
      description: "Message shown if the game times out waiting for picks",
      default: "⏰ Game timed out. Both players did not pick in time."
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

  command: async ({
    content,
    embedTitleStart,
    embedDescriptionStart,
    embedTitleResult,
    resultTieText,
    resultWinText,
    timeoutEnabled,
    timeoutSeconds,
    timeoutMessage,
    errorNotMentioned,
    errorSelfChallenge,
    errorAlreadyPicked,
    errorMissingPick,
    footer,
    buttonRockLabel,
    buttonPaperLabel,
    buttonScissorsLabel
  }, client, event) => {
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
      .replaceAll("{player1}", `<@${challenger.id}>`)
      .replaceAll("{player2}", `<@${challenged.id}>`);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rps_rock")
        .setLabel(buttonRockLabel)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis.rock),
      new ButtonBuilder()
        .setCustomId("rps_paper")
        .setLabel(buttonPaperLabel)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis.paper),
      new ButtonBuilder()
        .setCustomId("rps_scissors")
        .setLabel(buttonScissorsLabel)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis.scissors)
    );

    const challengeEmbed = new EmbedBuilder()
      .setTitle(embedTitleStart)
      .setDescription(startDescription)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? challenger : challenger).displayAvatarURL() })
      .setTimestamp();

    const challengeMessage = await event.respond({
      content,
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

    const collector = challengeMessage.createMessageComponentCollector({ filter, time: (timeoutEnabled) ? timeoutSeconds * 1000 : null });

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
        return event.respond(timeoutMessage);
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
          .replaceAll("{choice}", p1Choice)
          .replaceAll("{emoji}", emojis[p1Choice]);
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
          .replaceAll("{winner}", `<@${winner.id}>`)
          .replaceAll("{winnerChoice}", winnerChoice)
          .replaceAll("{winnerEmoji}", emojis[winnerChoice])
          .replaceAll("{loserChoice}", loserChoice)
          .replaceAll("{loserEmoji}", emojis[loserChoice]);
      };

      await challengeMessage.edit({ components: [] });

      const resultEmbed = new EmbedBuilder()
        .setTitle(embedTitleResult)
        .setDescription(resultText)
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? challenger : challenger).displayAvatarURL() })
        .setTimestamp();

      event.respond({ content, embeds: [resultEmbed] });
    });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to challenge")
          .setRequired(true)
      )
  ) : null
};