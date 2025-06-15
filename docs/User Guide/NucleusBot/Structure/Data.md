# 💾 Data Documentation

The `data/` folder in NucleusBot holds key files that **power your bot's internal logic and permissions**. These aren't just random JSONs — they’re essential to how your bot helps users, displays info, and keeps things secure. 🧠🔐

---

## 📁 What’s Inside?

There are currently **two important data files**:

---

### 📂 `categories.json`

This file organizes all your commands into neat categories.
Why? So your **help command** can display things cleanly and logically.

#### 🧾 Example contents:

```js
{
  "🛠️ Moderation": ["ban", "kick", "mute", "..."],
  "🎉 Fun": ["8ball", "meme", "roll", "..."],
  "🪄 AI": ["chat", "image", "tts", "..."]
}
```

> ✅ Used by: `help` command
> 📋 Helps categorize commands for user-friendly navigation

**💡 Want to add a new category?** Just update this file — and your help command will automatically show the new group.

---

### 📂 `permissions.json`

This file maps **Discord permission names** to their corresponding bitfield values.
Why? So your bot can **calculate permission links** and validate access — without just asking for `ADMINISTRATOR` like a chump. 😎

#### 🔐 Example snippet:

```js
{
  "KICK_MEMBERS": 2,
  "BAN_MEMBERS": 4,
  "MANAGE_CHANNELS": 16,
  ...
}
```

> ✅ Used when generating OAuth bot invite URLs
> 🔒 Prevents your bot from requesting unnecessary permissions

**⚠️ Reminder:**
We don’t just hand out `ADMIN` to everyone. These values help your bot **build clean permission scopes**, so it only asks for what it truly needs.

---

## 🛠️ Why This Matters

The files in `data/` keep your bot:

* 📚 Organized (for command categories)
* 🔐 Secure (for permission requests)
* 🤖 Smarter (so it adapts based on roles, scopes, or command visibility)

Edit them with care — and your bot will thank you. 💯