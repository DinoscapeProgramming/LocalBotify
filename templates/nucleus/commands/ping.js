module.exports = {
  variables: {
    responseMessage: [
      "Response Message",
      "The response after the user messages the ping command",
      "input:text"
    ]
  },
  command: ({
    responseMessage
  }, Client, message) => {
    message.channel.send(responseMessage);
  }
};