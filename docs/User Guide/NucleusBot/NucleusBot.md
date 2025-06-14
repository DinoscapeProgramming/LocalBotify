# ⚛️ NucleusBot Documentation

**NucleusBot** is the **default bot template** included with LocalBotify — designed to bring all no-code features to life with minimal setup. It’s fully customizable, modular, and even editable from inside the bot itself. 🧠⚙️

Whether you're just getting started or tweaking advanced features, NucleusBot gives you a solid, flexible foundation to build on.

---

## 🧱 NucleusBot Structure Overview

NucleusBot is organized into several key folders, each responsible for a different part of the bot's behavior and communication:

---

### 📡 `channels/` – Communication Layer

Handles all the **inter-process communication** between:

* 🧠 The LocalBotify app
* 🤖 Your running Node.js bot instance

These files act as text-based bridges for status updates, analytics, dialogs, and more.

> 📘 For a full breakdown, check out:
> 🔗 `Structure/Channels`

---

### 🎯 `trackers/` – Live Monitoring

Trackers are small scripts that **update bot data in real time**, feeding info into the channels system. They monitor things like:

* Bot status
* User/server stats
* Analytics (Pro-only)

> 🔍 Dive deeper in:
> 🔗 `Structure/Trackers`

---

### 💾 `data/` – Persistent Storage

Stores **bot state and important saved data** — such as:

* Warnings
* Leveling stats
* Economy balances
* Custom settings

This data stays intact even if the bot restarts.

> 📂 Learn more in:
> 🔗 `Structure/Data`

---

### ⚙️ `commands/` – Bot Functionality

Every action the bot can perform is defined here. You can:

* Add new commands with **Workbench**
* Edit variables in each command via **Command Editor**
* Group commands by category (Moderation, Fun, AI, etc.)

> 📚 Command docs live here:
> 🔗 `Structure/Commands`

---

### 🎉 `events/` – Dynamic Workflows

This is where **custom automations and reactions** are defined, such as:

* 🎟️ Ticket systems
* 👋 Welcome messages
* 🎂 Birthday events
* 🧠 Custom logic based on triggers

> 📖 Explore the details at:
> 🔗 `Structure/Events`

---

## 🚀 Why Use NucleusBot?

NucleusBot brings you:

* ✅ A ready-to-go no-code bot template
* 🧩 Modular structure for easy editing
* 🔄 Real-time syncing with the app
* 💪 Support for Pro features like analytics, AI, and event automation

Whether you're a beginner or building something advanced, NucleusBot is your launchpad. 🌟