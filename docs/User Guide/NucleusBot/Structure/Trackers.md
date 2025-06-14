# 📊 Trackers Documentation

Welcome to the **NucleusBot `trackers/` system**!
Trackers are lightweight modules that keep your bot's key stats and statuses up to date — in real time. This guide walks you through what each tracker does and how they work. 🔍

---

## 📡 What Are Trackers?

Trackers are small Node.js scripts that:

* ⏱️ Run on a regular schedule (usually every few seconds or minutes)
* 📝 Update data in specific `channels/` files
* 🔁 Help LocalBotify display **live info** about your bot

They're essential for real-time dashboards, status monitoring, and analytics.

---

## 🟢 `status.js`

* ✅ **Purpose**: Writes the **bot’s current status** to `status.txt`
* 🧭 **Used for**: Letting LocalBotify know if the bot is online, idle, etc.
* 📂 **Target Channel**:

  * `status.txt` — Shows live bot status
  * `process.txt` — Updates bot's runtime/process status

---

## 📈 `statistics.js`

* 📊 **Purpose**: Tracks and logs real-time bot analytics
* 🧮 **Used for**: Counting servers, users, and other key metrics
* 📂 **Target Channel**:

  * `statistics.txt` — Displays server/user stats
  * `analytics.txt` — Shows deeper usage trends (Pro-only)

> 💡 Want more stats? You can extend `statistics.js` with custom metrics!

---

## 🛠️ Why This Matters

Trackers help your bot stay transparent, insightful, and responsive. With up-to-date status and stats, you can:

* 🖥️ Power rich dashboards in LocalBotify
* 📉 Monitor performance over time
* 🚨 Spot issues early and act fast

They’re the quiet MVPs of your NucleusBot system. 🌟