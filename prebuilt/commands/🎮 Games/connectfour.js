if (!global.requireCore) (global.requireCore = () => ({}));

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Challenge someone to a game of Connect Four!",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "Regular message above the invite embed.",
      default: ""
    },

    title: {
      type: "textarea",
      title: "Embed Title",
      description: "Title of the embed message.",
      default: "🧩  Connect Four"
    },

    inviteMessage: {
      type: "textarea",
      title: "Invite Title",
      description: "Title of the invite message. Use {challenger} and {opponent} to mention the players.",
      default: "{challenger} vs {opponent}"
    },

    acceptMessage: {
      type: "textarea",
      title: "Accepted Message",
      description: "Title of the acceptation message. Use {challenger}, {opponent}, and {turn} to mention the players and show whose turn it is.",
      default: "🎮 {challenger} vs {opponent} — It's {turn}'s move!"
    },

    rejectMessage: {
      type: "textarea",
      title: "Rejected Message",
      description: "Title of the rejection message. Use {opponent} to mention the player who declined.",
      default: "❌ {opponent} declined the challenge."
    },

    timeoutMessage: {
      type: "textarea",
      title: "Timeout Message",
      description: "Title of the timeout message.",
      default: "⌛ Challenge timed out."
    },

    winMessage: {
      type: "textarea",
      title: "Win Message",
      description: "Title of the win message. Use {player} to mention the winning player.",
      default: "🏆 {player} wins the game!"
    },

    tieMessage: {
      type: "textarea",
      title: "Tie Message",
      description: "Title of the tie message.",
      default: "🤝 It's a draw!"
    },

    expirationMessage: {
      type: "textarea",
      title: "Expiration Message",
      description: "Title of the expiration message.",
      default: "⏱️ Game expired."
    },

    invalidUserMessage: {
      type: "textarea",
      title: "Invalid User Message",
      description: "Message shown when the opponent is not valid (e.g., bot or self).",
      default: "❌ Please mention a valid user to challenge."
    },

    fullColumnMessage: {
      type: "textarea",
      title: "Full Column Message",
      description: "Message shown when a player tries to place a piece in a full column.",
      default: "⚠️ This column is full! Please choose another."
    }
  },

  command: async ({
    content,
    title,
    inviteMessage,
    acceptMessage,
    rejectMessage,
    timeoutMessage,
    winMessage,
    tieMessage,
    expirationMessage,
    footer,
    invalidUserMessage,
    fullColumnMessage
  }, client, event) => {
    const challenger = event.member || event.author;
    const opponent = event.mentions?.users?.first() || event.options?.getUser("opponent");

    if (!opponent || opponent.bot || opponent.id === challenger.id) return event.reject(invalidUserMessage);

    const inviteEmbed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(inviteMessage.replaceAll("{challenger}", challenger.toString()).replaceAll("{opponent}", opponent.toString()) || null)
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp();

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
        return inviteMsg.edit({ content: null, embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(title || null)
            .setDescription(rejectMessage.replaceAll("{opponent}", opponent.toString()) || null)
            .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
            .setTimestamp()
        ], components: [] });
      };

      inviteCollector.stop("accepted");
      startGame(challenger, opponent, inviteMsg);
    });

    inviteCollector.on("end", async (_, reason) => {
      if ((reason !== "accepted") && (reason !== "rejected")) {
        await inviteMsg.edit({ content: null, embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(title || null)
            .setDescription(timeoutMessage || null)
            .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
            .setTimestamp()
        ], components: [] });
      };
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
        };
        return row;
      };

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(title || null)
        .setDescription(drawBoard())
        .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
        .setTimestamp();

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
          };
        };
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
          };
        };

        if (!placed) return i.reply({ content: null, embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(title || null)
            .setDescription(fullColumnMessage || null)
            .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
            .setTimestamp()
        ], ephemeral: true });

        if (checkWin(symbols[players[turn].id])) {
          collector.stop("win");
          return;
        };

        if (board.every(row => row.every(cell => cell !== "⚪"))) {
          collector.stop("tie");
          return;
        };

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
          endText = expirationMessage;
        };

        await gameMsg.edit({
          content: endText,
          embeds: [embed],
          components: []
        });
      });
    };
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addUserOption(option =>
        option.setName("opponent")
          .setDescription("User you want to challenge")
          .setRequired(true)
      )
  ) : null
};