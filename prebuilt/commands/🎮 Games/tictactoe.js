if (!global.requireCore) (global.requireCore = () => ({}));

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

const X = "❌";
const O = "⭕";

function checkWin(board, player) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  return lines.some((line) => line.every(i => (board[i] === player)));
};

module.exports = {
  description: "Play Tic-Tac-Toe with another user (no board display).",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    turnMessage: {
      type: "text",
      title: "Turn Message",
      description: "Message shown when it's a player's turn. Use {player} as a placeholder.",
      default: "It's your turn, {player}!"
    },

    winMessage: {
      type: "text",
      title: "Win Message",
      description: "Message sent when a player wins. Use {player} as a placeholder.",
      default: "{player} wins! 🎉"
    },

    drawMessage: {
      type: "text",
      title: "Draw Message",
      description: "Message sent when the game ends in a draw.",
      default: "It's a draw! 🤝"
    },

    timeoutEnabled: {
      type: "switch",
      title: "Enable Timeout",
      description: "Whether to enable a timeout for the game.",
      default: true
    },

    timeoutSeconds: {
      type: "number",
      title: "Timeout Seconds",
      description: "Number of seconds before the game times out.",
      default: 300
    },

    timeoutMessage: {
      type: "textarea",
      title: "Timeout Message",
      description: "Message sent when the game times out.",
      default: "⏰ Game timed out due to inactivity."
    },

    noOpponentMessage: {
      type: "text",
      title: "No Opponent Message",
      description: "Message sent when no opponent is mentioned.",
      default: "❌ You must mention a user to play with."
    },

    selfPlayMessage: {
      type: "text",
      title: "Self Play Message",
      description: "Message sent when a user tries to play against themselves.",
      default: "❌ You cannot play against yourself!"
    },

    cellTakenMessage: {
      type: "text",
      title: "Cell Taken Message",
      description: "Message sent when a player tries to take an already occupied cell.",
      default: "❌ That cell is already taken!"
    }
  },

  command: async ({
    turnMessage,
    winMessage,
    drawMessage,
    timeoutEnabled,
    timeoutSeconds,
    timeoutMessage,
    noOpponentMessage,
    selfPlayMessage,
    cellTakenMessage,
  }, client, event) => {
    const authorId = (commandType(event) === "message") ? event.author.id : event.user.id;

    let opponentUser = (commandType(event) === "message") ? event.mentions.users.first() : event.options?.getUser("user");

    if (!opponentUser) return event.respond(noOpponentMessage);
    if (opponentUser.id === authorId) return event.respond(selfPlayMessage);

    let board = Array(9).fill(null);
    let currentPlayer = X;
    let currentPlayerId = authorId;

    function createButtons(board, disabled = false) {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder();
        for (let col = 0; col < 3; col++) {
          const idx = row * 3 + col;
          actionRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`ttt_${idx}`)
              .setLabel(board[idx] || "\u200b")
              .setStyle(board[idx] ? ButtonStyle.Secondary : ButtonStyle.Primary)
              .setDisabled(disabled || Boolean(board[idx]))
          );
        };
        rows.push(actionRow);
      };
      return rows;
    };

    let messageContent = turnMessage.replaceAll("{player}", `<@${currentPlayerId}>`);

    const msg = await event.respond({
      content: messageContent,
      components: createButtons(board)
    });

    const filter = (i) =>
      (i.user.id === currentPlayerId) &&
      (i.message.id === msg.id) &&
      i.customId.startsWith("ttt_");

    const collector = msg.createMessageComponentCollector({ filter, time: (timeoutEnabled) ? timeoutSeconds * 1000 : null });

    collector.on("collect", async (i) => {
      const idx = Number(i.customId.split("_")[1]);
      if (board[idx]) {
        await i.reply({ content: cellTakenMessage, ephemeral: true });
        return;
      };
      board[idx] = currentPlayer;

      if (checkWin(board, currentPlayer)) {
        collector.stop("win");
        await i.update({
          content: winMessage.replaceAll("{player}", `<@${currentPlayerId}>`),
          components: createButtons(board, true)
        });
        return;
      };

      if (board.every(cell => cell)) {
        collector.stop("draw");
        await i.update({
          content: drawMessage,
          components: createButtons(board, true)
        });
        return;
      };

      currentPlayer = (currentPlayer === X) ? O : X;
      currentPlayerId = (currentPlayerId === authorId) ? opponentUser.id : authorId;

      await i.update({
        content: turnMessage.replaceAll("{player}", `<@${currentPlayerId}>`),
        components: createButtons(board)
      });
    });

    collector.on("end", (_, reason) => {
      if ((reason !== "win") && (reason !== "draw")) {
        event.channel.send(timeoutMessage);
        msg.edit({ components: createButtons(board, true) });
      };
    });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to play with")
          .setRequired(true)
      )
  ) : null
};