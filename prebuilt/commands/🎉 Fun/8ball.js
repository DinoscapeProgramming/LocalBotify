if (!global.requireCore) (global.requireCore = () => ({}));

const { EmbedBuilder, SlashCommandBuilder } = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Ask the magic 8-ball a yes or no question!",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text content above the response embed.",
      default: ""
    },

    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the response embed.",
      default: "🎱  Magic 8-Ball"
    },

    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },

    questionName: {
      type: "text",
      title: "Question Field Name",
      description: "The name of the field that will display the question.",
      default: "❓  Your Question"
    },

    questionValue: {
      type: "text",
      title: "Question Field Value",
      description: "The value of the field that will display the question.",
      default: "{question}"
    },

    answerName: {
      type: "text",
      title: "Answer Field Name",
      description: "The name of the field that will display the answer.",
      default: "🎱  My Answer"
    },

    answerValue: {
      type: "text",
      title: "Answer Field Value",
      description: "The value of the field that will display the answer.",
      default: "{answer}"
    },

    answerOptions: {
      type: "textarea",
      title: "Answer Options",
      description: "One answer per line. The bot will randomly select one of these answers.",
      default: "Yes.\nNo.\nMaybe.\nAsk again later.\nDefinitely.\nAbsolutely not.\nI can't tell you now.\nWithout a doubt.\nVery doubtful.\nIt is certain."
    },

    errorMessage: {
      type: "textarea",
      title: "Error Response Message",
      description: "The message to send if the question is not provided.",
      default: "🎱 You need to ask a question! Example: `!8ball Will I be rich?`"
    }
  },

  command: ({
    content,
    title,
    inline,
    questionName,
    questionValue,
    answerName,
    answerValue,
    answerOptions,
    footer,
    errorMessage
  }, client, event) => {
    const question = event.content?.split(" ").slice(1).join(" ");

    if (!question) return event.respond({ content: errorMessage, ephemeral: (commandType(event) === "interaction") });

    const answers = answerOptions?.trim().split("\n").filter(Boolean);
    const response = answers[Math.floor(Math.random() * answers.length)];

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title)
      .addFields(
        { name: questionName, value: questionValue.replaceAll("{question}", question), inline },
        { name: answerName, value: answerValue.replaceAll("{answer}", response), inline }
      )
      .setFooter({ text: footer, iconURL: ((commandType(event) === "message") ? event.author : event.user).displayAvatarURL() })
      .setTimestamp()

    event.respond({ content, embeds: [embed] });
  },

  slashCommand: (SlashCommandBuilder) ? (
    new SlashCommandBuilder()
      .addStringOption((option) =>
        option.setName("question")
          .setDescription("Your yes/no question")
          .setRequired(true)
      )
  ) : null
};