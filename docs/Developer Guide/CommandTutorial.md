# 💻 How to Write a Command (as a Developer)

Writing commands for the bot is straightforward and powerful. Just follow the steps below to create interactive and configurable commands using a simple module structure.

---

## 🗂️ 1. Create Your Command File

Navigate to the bot's `commands/` directory and create a new file.  
**The file name becomes the command name.**

> 📌 Example:  
> Creating a file named `ping.js` will allow users to trigger it with:
> ```
> prefix + ping
> ```

---

## 🎨 2. Write Your Description

Descriptions are necessary for the help command, but aren't required. This is how to provide one:

```js
module.exports = {
  description: "Check the bot's response time"
};
```

## 🛡️ 3. Set Your Permissions

Permissions will influence the bot's invite link accordingly:

```js
module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ]
}
```

---

## 🧩 4. Define Your Variables

Variables are used to make the command customizable globally. This means the bot owner can customize their bot's behaviour on all servers while the guild members have no access to these variables at all. **Do not use variables to let any user specify their command arguments, that's a fundamental misunderstanding of how they work.** Here's the full structure:

```js
module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    responseMessage: {
      title: "Response Message",
      description: "Message sent when the ping command is triggered",
      type: "slider",
      properties: {
        min: "0",
        max: "100"
      }
    }
  },

  command: ({ responseMessage }, client, message) => {
    message.channel.send(responseMessage);
  }
};
```

---

### 🧰 Supported Input Types

All variable types are **stored as strings** by default unless otherwise noted.

| Type            | Identifier         | Notes                                                                 |
|-----------------|--------------------|-----------------------------------------------------------------------|
| Text            | `text`             | Basic single-line input                                               |
| Textarea        | `textarea`         | Multi-line text input                                                 |
| Select          | `select`           | Dropdown; use `options` object (`{ value: "Label" }`)                 |
| Switch (Toggle) | `switch`           | Boolean toggle                                                        |
| Slider          | `slider`           | Use `min` and `max` inside `properties`; stored as `number`           |
| Number          | `number`           | Stored as number                                                      |
| Password        | `password`         | Obscured input                                                        |
| Search          | `search`           | Optimized for search                                                  |
| Email           | `email`            | Email format validation                                               |
| Telephone       | `telephone`        | For phone numbers                                                     |
| Link/URL        | `link`             | Validates URL format                                                  |
| Date            | `date`             | Calendar date selector                                                |
| Month           | `month`            | Month & year selector                                                 |
| Week            | `week`             | Week & year selector                                                  |
| Time            | `time`             | Time picker                                                           |
| DateTime-Local  | `datetime-local`   | Combined date and time (local)                                        |
| File Upload     | `file`             | User can upload a file                                                |
| Color Picker    | `color`            | Visual color selector                                                 |

---

### ⚙️ `properties` Object

You can enhance each variable using a `properties` object.

> 📌 Example:
```js
{
  title: "Your Message",
  type: "text",
  properties: {
    placeholder: "Enter your message here"
  }
}
```

---

## 🧠 5. Define the Command Logic

### 📦 Environment

Knowing the right versions of the packages you're using is essential to using the right methods. These packages come preshipped with LocalBotify and can be imported using LocalBotify's custom `requireCore()` and `importCore()` function (define empty functions for them at the top to ensure the variables can be loaded inside the LocalBotify workbench). If this list doesn't contain your desired package, use `require()` instead, requiring manual installation.

| Package                  | Version    |
|--------------------------|------------|
| @lydell/node-pty         | ^1.1.0     |
| @teeny-tiny/dotenv       | ^1.0.10    |
| @teeny-tiny/open         | ^1.1.4     |
| @xterm/xterm             | ^5.5.0     |
| discord.js               | ^14.18.0   |
| localbotify              | ^2.1.0     |
| markdown-wasm            | ^1.2.0     |
| node-cron                | ^3.0.3     |
| node-fetch               | ^3.3.2     |
| pantry.js                | ^1.0.7     |
| shiki                    | ^3.3.0     |
| unzipper                 | ^0.12.3    |

---

Instead of having to differentiate between messages and interactions, the event's `respond()` method is always binded to the corresponding reply function (`message.channel.send()` for messages; `interaction.reply()` for interactions).

Here's the full structure again for clarity:

```js
if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    responseMessage: {
      title: "Response Message",
      type: "text",
      properties: {
        placeholder: "Hey there!"
      }
    }
  },

  command: (variables, client, event) => {
    event.respond(variables.responseMessage);
  }
};
```

## 🔧 6. Register the Slash Command

The description will be applied automatically using the description you specified. Define the `slashCommand` property like this:

```js
if (!global.requireCore) (global.requireCore = () => ({}));

const Discord = requireCore("discord.js");
const { commandType } = requireCore("localbotify");

module.exports = {
  description: "Check the bot's response time",

  permissions: [
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY"
  ],

  variables: {
    responseMessage: {
      title: "Response Message",
      type: "text",
      properties: {
        placeholder: "Hey there!"
      }
    }
  },

  command: (variables, client, event) => {
    event.respond(variables.responseMessage)
  },

  slashCommand: (Discord.SlashCommandBuilder) ? (new Discord.SlashCommandBuilder()
    .setName("ping")) : null
};
```

---

## ✅ That's It!

Once the file is in place and structured properly, the bot will automatically register it as a new command, complete with custom options and UI.

Need help writing a specific type of command? Just ask in our [Discord server](https://discord.gg/gSrCtBMgeY)!