# 🎉 Events Documentation

Events let your bot **react to real-time activity** on your server — like users joining, messages being posted, or voice state changes. They’re like commands, but they **trigger automatically** based on what’s happening.

Think ticket systems, welcome messages, moderation alerts — that kind of magic. ✨

---

## ➕ How to Add an Event

To create an event:

1. Open your bot in the **Workbench**
2. Click **`Add Event`**
3. Select the event type from the list
4. Click on the event you added to open the **Event Editor**
5. Customize the variables to control what your bot does

> 🧠 Pro Tip: Combine events with custom commands to build full workflows!

---

## ⚙️ Prebuilt Events

Here’s a list of all available built-in events, organized by category:

---

### ⚙️ Bot-Level Events

* `error`
* `interactionCreate`
* `ready`
* `warn`

---

### 🎙️ Voice Events

* `voiceStateUpdate`

---

### 👤 Member Events

* `guildMemberAdd`
* `guildMemberRemove`
* `guildMemberUpdate`

---

### 👥 Guild Events

* `guildCreate`
* `guildDelete`
* `guildUpdate`

---

### 📝 Message Events

* `messageCreate`
* `messageDelete`
* `messageReactionAdd`
* `messageReactionRemove`
* `messageUpdate`

---

### 🔒 Moderation Events

* `channelCreate`
* `channelDelete`
* `channelUpdate`
* `roleCreate`
* `roleDelete`
* `roleUpdate`

---

### 🕵️ User Status Events

* `presenceUpdate`

---

## 🎯 Why Use Events?

Events make your bot feel alive — they allow it to:

* 👋 Welcome new members
* 🛠️ Log changes to channels or roles
* 🎟️ Power support systems like tickets
* 📌 React to messages or reactions
* 🔊 Monitor voice channel activity

They’re the backbone of automation inside your bot.