if (!global.requireCore) (global.requireCore = () => ({}));

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");

module.exports = {
  description: "Challenge someone to a game of Connect Four!",
  permissions: ["SEND_MESSAGES"],
  variables: {
    content: {
      type: "text",
      title: "Content Above Embed",
      default: ""
    },
    footer: {
      type: "text",
      title: "Footer",
      default: "LocalBotify Connect Four"
    },
    color: {
      type: "color",
      title: "Embed Color",
      default: "#f1c40f"
    },
    inviteMessage: {
      type: "text",
      title: "Invite Title",
      default: "{challenger} vs {opponent}"
    },
    acceptMessage: {
      type: "text",
      title: "Accepted Message",
      default: "🎮 {challenger} vs {opponent} — It's {turn}'s move!"
    },
    rejectMessage: {
      type: "text",
      title: "Rejected Message",
      default: "❌ {opponent} declined the challenge."
    },
    timeoutMessage: {
      type: "text",
      title: "Timeout Message",
      default: "⌛ Challenge timed out."
    },
    winMessage: {
      type: "text",
      title: "Win Message",
      default: "🏆 {player} wins the game!"
    },
    tieMessage: {
      type: "text",
      title: "Tie Message",
      default: "🤝 It's a draw!"
    }
  },

  command: async ({ content, footer, color, inviteMessage, acceptMessage, rejectMessage, timeoutMessage, winMessage, tieMessage }, client, event) => {
    const challenger = event.member || event.author;
    const opponent = event.mentions?.users?.first() || event.options?.getUser("opponent");

    if (!opponent || opponent.bot || opponent.id === challenger.id) {
      return event.respond("❌ Mention a valid user to challenge.");
    }

    const inviteEmbed = new EmbedBuilder()
      .setTitle("🎮  Connect Four Challenge")
      .setDescription(inviteMessage.replaceAll("{challenger}", challenger.toString()).replaceAll("{opponent}", opponent.toString()))
      .setColor(color)
      .setFooter({ text: footer });

    const inviteMsg = await event.respond({
      content,
      embeds: [inviteEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("accept").setLabel("Accept").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("reject").setLabel("Decline").setStyle(ButtonStyle.Danger)
        )
      ]
    });

    const inviteCollector = inviteMsg.createMessageComponentCollector({
      time: 30_000,
      filter: (i) => i.user.id === opponent.id
    });

    inviteCollector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      if (interaction.customId === "reject") {
        inviteCollector.stop("rejected");
        return inviteMsg.edit({ content: rejectMessage.replaceAll("{opponent}", opponent.toString()), embeds: [], components: [] });
      }

      inviteCollector.stop("accepted");
      startGame(challenger, opponent, inviteMsg);
    });

    inviteCollector.on("end", async (_, reason) => {
      if (reason !== "accepted" && reason !== "rejected") {
        await inviteMsg.edit({ content: timeoutMessage, embeds: [], components: [] });
      }
    });

    async function startGame(p1, p2, msg) {
      let board = Array.from({ length: 6 }, () => Array(7).fill("⚪"));
      const symbols = { [p1.id]: "🔴", [p2.id]: "🟡" };
      const players = [p1, p2];
      let turn = 0;

      const drawBoard = () => board.map(row => row.join("")).join("\n");

      const buildButtons = () => {
        const row = new ActionRowBuilder();
        for (let i = 0; i < 7; i++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`col_${i}`)
              .setLabel(`${i + 1}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(board[0][i] !== "⚪")
          );
        }
        return row;
      };

      const embed = new EmbedBuilder()
        .setTitle("🧩 Connect Four")
        .setDescription(drawBoard())
        .setColor(color)
        .setFooter({ text: footer });

      const gameMsg = await msg.edit({
        content: acceptMessage
          .replaceAll("{challenger}", p1.toString())
          .replaceAll("{opponent}", p2.toString())
          .replaceAll("{turn}", players[turn].toString()),
        embeds: [embed],
        components: [buildButtons()]
      });

      const collector = gameMsg.createMessageComponentCollector({
        time: 5 * 60_000,
        filter: (i) => i.user.id === players[turn].id
      });

      const checkWin = (symbol) => {
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 7; c++) {
            if (c + 3 < 7 && board[r][c] === symbol && board[r][c + 1] === symbol && board[r][c + 2] === symbol && board[r][c + 3] === symbol)
              return true;
            if (r + 3 < 6 && board[r][c] === symbol && board[r + 1][c] === symbol && board[r + 2][c] === symbol && board[r + 3][c] === symbol)
              return true;
            if (r + 3 < 6 && c + 3 < 7 && board[r][c] === symbol && board[r + 1][c + 1] === symbol && board[r + 2][c + 2] === symbol && board[r + 3][c + 3] === symbol)
              return true;
            if (r - 3 >= 0 && c + 3 < 7 && board[r][c] === symbol && board[r - 1][c + 1] === symbol && board[r - 2][c + 2] === symbol && board[r - 3][c + 3] === symbol)
              return true;
          }
        }
        return false;
      };

      collector.on("collect", async (i) => {
        const col = parseInt(i.customId.split("_")[1]);
        let placed = false;

        for (let r = 5; r >= 0; r--) {
          if (board[r][col] === "⚪") {
            board[r][col] = symbols[players[turn].id];
            placed = true;
            break;
          }
        }

        if (!placed) return i.reply({ content: "❌ Column is full!", ephemeral: true });

        if (checkWin(symbols[players[turn].id])) {
          collector.stop("win");
          return;
        }

        if (board.every(row => row.every(cell => cell !== "⚪"))) {
          collector.stop("tie");
          return;
        }

        turn = 1 - turn;
        embed.setDescription(drawBoard());

        await i.update({
          content: `🎮 ${players[turn]}'s turn!`,
          embeds: [embed],
          components: [buildButtons()]
        });
      });

      collector.on("end", async (_, reason) => {
        embed.setDescription(drawBoard());

        let endText = "";
        if (reason === "win") {
          endText = winMessage.replaceAll("{player}", players[turn].toString());
        } else if (reason === "tie") {
          endText = tieMessage;
        } else {
          endText = "⏱️ Game expired.";
        }

        await gameMsg.edit({
          content: endText,
          embeds: [embed],
          components: []
        });
      });
    }
  },

  slashCommand: new SlashCommandBuilder()
    .addUserOption(option =>
      option.setName("opponent")
        .setDescription("User you want to challenge")
        .setRequired(true)
    )
};