if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
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

  permissions: ["SEND_MESSAGES"],

  variables: {
    timeoutMessage: {
      type: "textarea",
      title: "Timeout Message",
      description: "Message sent when the game times out.",
      default: "⏰ Game timed out due to inactivity."
    },
    inviteMessage: {
      type: "text",
      title: "Invite Message",
      description: "Message shown to mention the opponent.",
      default: "It's your turn, {player}!"
    }
  },

  command: async ({
    timeoutMessage,
    inviteMessage
  }, client, event) => {
    const authorId = (commandType(event) === "message") ? event.author.id : event.user.id;

    let opponentUser = (commandType(event) === "message") ? event.mentions.users.first() : event.options?.getUser("user");

    if (!opponentUser) return event.respond("❌ You must mention a user to play with.");
    if (opponentUser.id === authorId) return event.respond("❌ You cannot play against yourself!");

    let board = Array(9).fill(null);
    let currentPlayer = X;
    let currentPlayerId = authorId;

    function createButtons(board, disabled = false) {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        const actionRow = new Discord.ActionRowBuilder();
        for (let col = 0; col < 3; col++) {
          const idx = row * 3 + col;
          actionRow.addComponents(
            new Discord.ButtonBuilder()
              .setCustomId(`ttt_${idx}`)
              .setLabel(board[idx] || "\u200b")
              .setStyle(board[idx] ? Discord.ButtonStyle.Secondary : Discord.ButtonStyle.Primary)
              .setDisabled(disabled || Boolean(board[idx]))
          );
        };
        rows.push(actionRow);
      };
      return rows;
    };

    let messageContent = inviteMessage.replace("{player}", `<@${currentPlayerId}>`);

    const msg = await event.respond({
      content: messageContent,
      components: createButtons(board)
    });

    const filter = (i) =>
      (i.user.id === currentPlayerId) &&
      (i.message.id === msg.id) &&
      i.customId.startsWith("ttt_");

    const collector = msg.createMessageComponentCollector({ filter, time: 300000 });

    collector.on("collect", async (i) => {
      const idx = Number(i.customId.split("_")[1]);
      if (board[idx]) {
        await i.reply({ content: "❌ That cell is already taken!", ephemeral: true });
        return;
      };
      board[idx] = currentPlayer;

      if (checkWin(board, currentPlayer)) {
        collector.stop("win");
        await i.update({
          content: `<@${currentPlayerId}> wins! 🎉`,
          components: createButtons(board, true)
        });
        return;
      };

      if (board.every(cell => cell)) {
        collector.stop("draw");
        await i.update({
          content: `It's a draw! 🤝`,
          components: createButtons(board, true)
        });
        return;
      };

      currentPlayer = (currentPlayer === X) ? O : X;
      currentPlayerId = (currentPlayerId === authorId) ? opponentUser.id : authorId;

      await i.update({
        content: inviteMessage.replace("{player}", `<@${currentPlayerId}>`),
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

  slashCommand: (Discord.SlashCommandBuilder) ? (
    new Discord.SlashCommandBuilder()
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to play with")
          .setRequired(true)
      )
  ) : null
};