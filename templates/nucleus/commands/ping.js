module.exports = {
  variables: {
    responseMessage: [
      "Response Message",
      "The response after the user messages the ping command"
    ]
  },
  command: (Client, message) => {
    message.channel.send("Pong!");
  }
};