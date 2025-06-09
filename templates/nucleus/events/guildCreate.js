module.exports = {
  description: "Send a welcome message once a server adds the bot",

  permissions: [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    content: {
      type: "textarea",
      title: "Content",
      description: "The regular text message above your welcome embed"
    },
    title: {
      type: "text",
      title: "Embed Title",
      description: "The title of the welcome embed",
      default: "Thanks for inviting me! 🥳"
    },
    description: {
      type: "textarea",
      title: "Embed Description",
      description: "The description of the welcome embed",
      default: `Hello **\${guildName}**! 👋

I'm your new assistant bot, here to make your server more fun and functional! 🎉

See what I can do for you by typing \`\${prefix}help\`.

**Need help?**
You can always ask for assistance or reach out in the support server: [Support Server Link](\${supportServer})      

I'm looking forward to helping out! 😊`
    }
  },

  command: ({
    content,
    title,
    description
  }, client, event) => {

  }
};