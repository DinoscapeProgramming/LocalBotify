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
      description: "Message above the embed.",
      default: ""
    },

    embedTitleStart: {
      type: "textarea",
      title: "Embed Title - Start",
      description: "Title for the challenge embed.",
      default: "🪨📄✂️  Rock-Paper-Scissors"
    },

    embedDescriptionStart: {
      type: "textarea",
      title: "Embed Description - Start",
      description: "Use {player1} and {player2} as placeholders.",
      default: "{player1} has challenged {player2}!\n\nBoth players, please pick your choice by clicking one of the buttons below."
    },

    embedTitleSelection: {
      type: "textarea",
      title: "Embed Title - Selection",
      description: "Title for the selection embed.",
      default: "🪨📄✂️  Rock-Paper-Scissors Selection"
    },

    embedDescriptionSelection: {
      type: "textarea",
      title: "Embed Description - Selection",
      description: "Use {choice} and {emoji} as placeholders.",
      default: "You picked **{choice}** {emoji}!"
    },

    embedTitleResult: {
      type: "textarea",
      title: "Embed Title - Result",
      description: "Title for the result embed.",
      default: "🪨📄✂️  Rock-Paper-Scissors Result"
    },

    resultTieText: {
      type: "textarea",
      title: "Result Text - Tie",
      description: "Shown when it's a tie. Use {choice} and {emoji}.",
      default: "It's a tie! Both chose **{choice}** {emoji}"
    },

    resultWinText: {
      type: "textarea",
      title: "Result Text - Win",
      description: "Shown when someone wins. Use {winner}, {winnerChoice}, {winnerEmoji}, {loserChoice}, {loserEmoji}.",
      default: "{winner} wins! **{winnerChoice}** {winnerEmoji} beats **{loserChoice}** {loserEmoji}"
    },

    timeoutEnabled: {
      type: "switch",
      title: "Enable Timeout",
      description: "Enable a timeout for the game.",
      default: true
    },

    timeoutSeconds: {
      type: "number",
      title: "Timeout (seconds)",
      description: "Seconds to wait for both players.",
      default: 30
    },

    timeoutMessage: {
      type: "textarea",
      title: "Timeout Message",
      description: "Shown if the game times out.",
      default: "⏰ Game timed out. Both players did not pick in time."
    },

    errorNotMentioned: {
      type: "textarea",
      title: "Error - No Opponent",
      description: "Shown if no opponent was mentioned.",
      default: "⚠️ You need to mention a user to challenge."
    },

    errorSelfChallenge: {
      type: "textarea",
      title: "Error - Self Challenge",
      description: "Shown if user tries to challenge themselves.",
      default: "⚠️ You cannot play against yourself!"
    },

    errorAlreadyPicked: {
      type: "textarea",
      title: "Error - Already Picked",
      description: "Shown if a player tries to pick more than once.",
      default: "⚠️ You already made your choice!"
    },

    errorMissingPick: {
      type: "textarea",
      title: "Error - Missing Pick",
      description: "Shown if one or both picks are missing.",
      default: "❌ Something went wrong. One or both players didn't pick."
    },

    buttonRockLabel: {
      type: "textarea",
      title: "Button Label - Rock",
      description: "Label for the rock button.",
      default: "Rock"
    },

    buttonPaperLabel: {
      type: "textarea",
      title: "Button Label - Paper",
      description: "Label for the paper button.",
      default: "Paper"
    },

    buttonScissorsLabel: {
      type: "textarea",
      title: "Button Label - Scissors",
      description: "Label for the scissors button.",
      default: "Scissors"
    }
  },

  command: async ({
    content,
    embedTitleStart,
    embedDescriptionStart,
    embedTitleSelection,
    embedDescriptionSelection,
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
    buttonRockLabel,
    buttonPaperLabel,
    buttonScissorsLabel,
    footer
  }, client, event) => {
    let challenger, challenged;
    if (commandType(event) === "message") {
      challenger = event.author;
      challenged = event.mentions.users.first();
    } else {
      challenger = event.user;
      challenged = event.options.getUser("user");
    }

    if (!challenged) return event.reject(errorNotMentioned);
    if (challenged.id === challenger.id) return event.reject(errorSelfChallenge);

    const startDescription = (embedDescriptionStart || "")
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
      .setColor(0x00bfff)
      .setTitle(embedTitleStart || null)
      .setDescription(startDescription || null)
      .setFooter({ text: footer, iconURL: challenger.displayAvatarURL() })
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

    const collector = challengeMessage.createMessageComponentCollector({ filter, time: timeoutEnabled ? timeoutSeconds * 1000 : null });

    collector.on("collect", async (interaction) => {
      const playerId = interaction.user.id;

      if (picks.has(playerId)) {
        await interaction.reply({
          content: null,
          embeds: [
            new EmbedBuilder()
              .setColor(0xffcc00)
              .setTitle(embedTitleStart || null)
              .setDescription(errorAlreadyPicked || null)
              .setFooter({ text: footer, iconURL: interaction.user.displayAvatarURL() })
              .setTimestamp()
          ],
          ephemeral: true
        });
        return;
      }

      const choice = interaction.customId.split("_")[1];
      picks.set(playerId, choice);

      await interaction.reply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(0x00bfff)
            .setTitle(embedTitleSelection || null)
            .setDescription(
              (embedDescriptionSelection || "")
                .replaceAll("{choice}", choice)
                .replaceAll("{emoji}", emojis[choice])
            )
            .setFooter({ text: footer, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()
        ],
        ephemeral: true
      });

      if (bothPicked()) {
        collector.stop("completed");
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "completed") {
        await challengeMessage.edit({ components: [] });
        return event.respond({
          content: null,
          embeds: [
            new EmbedBuilder()
              .setColor(0xff3333)
              .setTitle(embedTitleResult || null)
              .setDescription(timeoutMessage || null)
              .setFooter({ text: footer, iconURL: challenger.displayAvatarURL() })
              .setTimestamp()
          ]
        });
      }

      const p1Choice = picks.get(challenger.id);
      const p2Choice = picks.get(challenged.id);

      if (!p1Choice || !p2Choice) {
        await challengeMessage.edit({ components: [] });
        return event.respond({
          content: null,
          embeds: [
            new EmbedBuilder()
              .setColor(0xff3333)
              .setTitle(embedTitleResult || null)
              .setDescription(errorMissingPick || null)
              .setFooter({ text: footer, iconURL: challenger.displayAvatarURL() })
              .setTimestamp()
          ]
        });
      }

      let resultText;
      if (p1Choice === p2Choice) {
        resultText = (resultTieText || "")
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
        }

        resultText = (resultWinText || "")
          .replaceAll("{winner}", `<@${winner.id}>`)
          .replaceAll("{winnerChoice}", winnerChoice)
          .replaceAll("{winnerEmoji}", emojis[winnerChoice])
          .replaceAll("{loserChoice}", loserChoice)
          .replaceAll("{loserEmoji}", emojis[loserChoice]);
      }

      await challengeMessage.edit({ components: [] });

      const resultEmbed = new EmbedBuilder()
        .setTitle(embedTitleResult || null)
        .setDescription(resultText || null)
        .setFooter({ text: footer, iconURL: challenger.displayAvatarURL() })
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