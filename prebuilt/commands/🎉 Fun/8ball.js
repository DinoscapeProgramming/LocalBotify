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
      type: "textarea",
      title: "Embed Title",
      description: "The title of the response embed.",
      default: "🎱  Magic 8-Ball"
    },

    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the response embed.",
      default: ""
    },

    inline: {
      type: "switch",
      title: "Inline Fields",
      description: "Whether the fields in the embed should be displayed inline.",
      default: false
    },

    questionName: {
      type: "textarea",
      title: "Question Field Name",
      description: "The name of the field that will display the question.",
      default: "❓  Your Question"
    },

    questionValue: {
      type: "textarea",
      title: "Question Field Value",
      description: "The value of the field that will display the question. Use {question} to insert the user's question.",
      default: "{question}"
    },

    answerName: {
      type: "textarea",
      title: "Answer Field Name",
      description: "The name of the field that will display the answer.",
      default: "🎱  My Answer"
    },

    answerValue: {
      type: "textarea",
      title: "Answer Field Value",
      description: "The value of the field that will display the answer. Use {answer} to insert the bot's answer.",
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
      default: "❌ You need to ask a question!"
    }
  },

  command: ({
    content,
    title,
    description,
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

    if (!question) return event.reject(errorMessage);

    const answers = answerOptions?.trim().split("\n").filter(Boolean);
    const response = answers[Math.floor(Math.random() * answers.length)];

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle(title || null)
      .setDescription(description || null)
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