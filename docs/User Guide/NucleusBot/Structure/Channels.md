# 📺 Channels Documentation

Welcome to the **NucleusBot `channels/` directory**! You might’ve spotted a few text files in there and wondered what they're all about. This guide breaks it down for you. ✨

## 📡 What Are Channels?

Channels are **text-based communication bridges** used to send and receive information between:

- 🧠 **LocalBotify (the local controller UI)**  
- 🚀 **Your Nucleus Bot (running in a separate Node.js process)**

They help both sides stay in sync, show accurate data, and trigger actions smoothly.

---

## 📂 Overview of Available Channels

Each channel file serves a specific purpose. Let’s go through them one by one:

---

### 🟢 `process.txt`

- ✅ **Purpose**: Indicates whether the bot's process is currently running.
- 🧭 **Used for**: Updating the **start/stop button text and icon** in LocalBotify.

---

### 🌐 `status.txt`

- 📶 **Purpose**: Reflects the bot's online/offline status.
- 🏠 **Used for**: Displaying real-time status on the **LocalBotify home dashboard**.

---

### 📊 `statistics.txt`

- 📈 **Purpose**: Contains server and user count statistics.
- 📋 **Used for**: Showing activity data on the **LocalBotify dashboard**.

---

### ⚠️ `error.txt`

- 💥 **Purpose**: Captures any **runtime errors** or crashes.
- 🚨 **Used for**: Triggering **error notifications** and debugging insights.

---

### 💬 `dialog.txt`

- 🗨️ **Purpose**: Logs dialog prompts initiated from LocalBotify.
- 🔁 **Used for**: Displaying dialog windows and **sending back user responses** to the bot's Node.js process.

---

## 🛠️ Why This Matters

These channel files are essential for **smooth interaction** between the frontend UI and your backend bot process. They allow LocalBotify to monitor, control, and interact with your bot in real time—all without needing direct integration.