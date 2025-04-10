module.exports = {
  variables: {
    responseMessage: {
      title: "Response Message",
      description: "The response after the user messages the ping command",
      type: "slider",
      properties: {
        min: "0",
        max: "100"
      }
    }
  },
  command: ({
    responseMessage
  }, client, message) => {
    message.channel.send(responseMessage);
  }
};