if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");
const he = requireCore("he");

module.exports = {
  description: "Answer a random trivia question!",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content Above Embed",
      description: "Text to show above the embed message.",
      default: ""
    },
    title: {
      type: "textarea",
      title: "Embed Title",
      description: "The title of the trivia embed.",
      default: "🧠 Trivia Time!"
    },
    category: {
      type: "textarea",
      title: "Trivia Category (optional)",
      description: "Leave blank for any. Examples: 18 (CS), 9 (General Knowledge)",
      default: ""
    },
    difficulty: {
      type: "select",
      title: "Difficulty",
      description: "Leave blank for any. Options: easy, medium, hard.",
      options: {
        any: "Any",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard"
      },
      default: "any"
    },
    correctMsg: {
      type: "textarea",
      title: "Correct Answer Message",
      description: "Message shown when the user answers correctly. Use {answer} to show the correct answer.",
      default: "✅ Correct! You're smart!"
    },
    wrongMsg: {
      type: "textarea",
      title: "Wrong Answer Message",
      description: "Message shown when the user answers incorrectly. Use {answer} to show the correct answer.",
      default: "❌ Wrong! The correct answer was **{answer}**."
    },
    timeoutMsg: {
      type: "textarea",
      title: "Timeout Message",
      description: "Message shown when the time runs out. Use {answer} to show the correct answer.",
      default: "⏱️ Time's up! The answer was **{answer}**."
    },
    secondsToAnswer: {
      type: "number",
      title: "Seconds to Answer",
      description: "How long the user has to answer the question (in seconds).",
      default: 20
    }
  },

  command: async ({
    content,
    title,
    footer,
    category,
    difficulty,
    correctMsg,
    wrongMsg,
    timeoutMsg,
    secondsToAnswer
  }, client, event) => {
    const url = new URL("https://opentdb.com/api.php");
    url.searchParams.set("amount", "1");
    if (category) url.searchParams.set("category", category);
    if (difficulty) url.searchParams.set("difficulty", difficulty);
    url.searchParams.set("type", "multiple");

    try {
      const res = await fetch(url.toString());
      const json = await res.json();

      if (!json.results || !json.results[0]) return event.respond("❌ No trivia question found.");

      const q = json.results[0];
      const question = he.decode(q.question);
      const correct = he.decode(q.correct_answer);
      const choices = q.incorrect_answers.map(ans => he.decode(ans));
      choices.push(correct);
      choices.sort(() => Math.random() - 0.5);

      const buttons = new Discord.ActionRowBuilder().addComponents(
        choices.map((choice, i) =>
          new Discord.ButtonBuilder()
            .setCustomId(`trivia_${i}`)
            .setLabel(choice)
            .setStyle(Discord.ButtonStyle.Primary)
        )
      );

      const msg = await event.respond({
        content,
        embeds: [
          new Discord.EmbedBuilder()
            .setColor(0x00bfff)
            .setTitle(title || null)
            .setDescription(`**${question}**`)
            .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
            .setTimestamp()
        ],
        components: [buttons]
      });

      const filter = i => {
        const userId = (commandType(event) === "message") ? event.author.id : event.user.id;
        return i.user.id === userId;
      };

      const interaction = await msg.awaitMessageComponent({
        filter,
        time: secondsToAnswer * 1000
      });

      const selected = interaction.component.label;
      const responseText = (selected === correct)
        ? correctMsg
        : wrongMsg.replaceAll("{answer}", correct);

      await interaction.update({
        content: responseText,
        embeds: [],
        components: []
      });
    } catch {
      await event.respond(timeoutMsg.replaceAll("{answer}", "unknown"));
    };
  },

  slashCommand: (Discord.SlashCommandBuilder) ? new Discord.SlashCommandBuilder() : null
};