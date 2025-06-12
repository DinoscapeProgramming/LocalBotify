Object.assign(process.env, require("fs").readFileSync(require("path").join(__dirname, "../.env"), "utf8").split("\n").filter((line) => !line.startsWith("#") && (line.split("=").length > 1)).map((line) => line.trim().split("#")[0].split("=")).reduce((data, accumulator) => ({
  ...data,
  ...{
    [accumulator[0]]: JSON.parse(accumulator[1].trim().replace(/\{([^}]+)\}/g, (_, expression) => eval(expression)))
  }
}), {}));
const { ipcRenderer } = require("electron");
const fs = {
  _safeCall: (method, ...args) => {
    try {
      return method(...args);
    } catch (err) {
      return null;
    }
  },

  readFile: (...args) => fs._safeCall(require("fs").readFile, ...args),
  writeFile: (...args) => fs._safeCall(require("fs").writeFile, ...args),
  appendFile: (...args) => fs._safeCall(require("fs").appendFile, ...args),
  unlink: (...args) => fs._safeCall(require("fs").unlink, ...args),
  mkdir: (...args) => fs._safeCall(require("fs").mkdir, ...args),
  readdir: (...args) => fs._safeCall(require("fs").readdir, ...args),
  stat: (...args) => fs._safeCall(require("fs").stat, ...args),
  watch: (...args) => fs._safeCall(require("fs").watch, ...args),
  rename: (...args) => fs._safeCall(require("fs").rename, ...args),
  copyFile: (...args) => fs._safeCall(require("fs").copyFile, ...args),
  rmdir: (...args) => fs._safeCall(require("fs").rmdir, ...args),
  chmod: (...args) => fs._safeCall(require("fs").chmod, ...args),
  chown: (...args) => fs._safeCall(require("fs").chown, ...args),
  utimes: (...args) => fs._safeCall(require("fs").utimes, ...args),
  cp: (...args) => fs._safeCall(require("fs").cp, ...args),
  exists: (...args) => fs._safeCall(require("fs").exists, ...args),
  access: (...args) => fs._safeCall(require("fs").access, ...args),

  readFileSync: (...args) => fs._safeCall(require("fs").readFileSync, ...args),
  writeFileSync: (...args) => fs._safeCall(require("fs").writeFileSync, ...args),
  appendFileSync: (...args) => fs._safeCall(require("fs").appendFileSync, ...args),
  unlinkSync: (...args) => fs._safeCall(require("fs").unlinkSync, ...args),
  mkdirSync: (...args) => fs._safeCall(require("fs").mkdirSync, ...args),
  readdirSync: (...args) => fs._safeCall(require("fs").readdirSync, ...args),
  statSync: (...args) => fs._safeCall(require("fs").statSync, ...args),
  renameSync: (...args) => fs._safeCall(require("fs").renameSync, ...args),
  copyFileSync: (...args) => fs._safeCall(require("fs").copyFileSync, ...args),
  rmdirSync: (...args) => fs._safeCall(require("fs").rmdirSync, ...args),
  chmodSync: (...args) => fs._safeCall(require("fs").chmodSync, ...args),
  chownSync: (...args) => fs._safeCall(require("fs").chownSync, ...args),
  utimesSync: (...args) => fs._safeCall(require("fs").utimesSync, ...args),
  cpSync: (...args) => fs._safeCall(require("fs").cpSync, ...args),
  existsSync: (...args) => fs._safeCall(require("fs").existsSync, ...args),
  accessSync: (...args) => fs._safeCall(require("fs").accessSync, ...args)
};

if (process.argv.includes("--startup")) process.chdir(process.argv.find((argument) => argument.startsWith("--cwd=")).split("=").slice(1).join("="));

class LocalBotify {
  constructor() {
    this.isPackaged = require("path").basename(process.execPath) !== "electron.exe";
    this.isProPlan = !this.isPackaged;

    this.bots = JSON.parse(localStorage.getItem("bots")) || [];
    this.currentView = "bots";
    this.renderContent();
    this.setupEventListeners();
    this.updateSettings();
    this.showAnnouncement();
    this.runBots();
  };

  saveBots() {
    localStorage.setItem("bots", JSON.stringify(this.bots));
  };

  renderContent() {
    (this.statusWatchers || []).forEach((statusWatcher) => statusWatcher.close());
    (this.statusWatchers || []).forEach((statisticsWatcher) => statisticsWatcher.close());

    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = "";

    const header = this.createHeader();
    mainContent.appendChild(header);

    const content = document.createElement("div");
    content.className = "content";

    if (this.currentView === "help") {
      content.style.overflowY = "hidden";
    };

    switch (this.currentView) {
      case "bots":
        document.querySelector(".app").style.removeProperty("background-color");
        if (this.bots.length) {
          content.classList.remove("no-bots");
          content.appendChild(this.createBotGrid());
        } else {
          content.classList.add("no-bots");

          content.innerHTML = `
            <i class="fas fa-magnifying-glass" style="
              font-size: 5rem;
              margin-bottom: 1.5rem;
              opacity: 0.8;
            "></i>
            <p style="opacity: 0.8; margin-bottom: 0.6rem;">Yikes. So quiet here...</p>
            <button class="create-btn" style="
              width: 19.5ch;
              justify-content: center;
              white-space: nowrap;
            ">
              <i class="fas fa-plus"></i>Create Bot Now
            </button>
          `;
        };
        break;
      case "store":
        document.querySelector(".app").style.removeProperty("background-color");
        if (!navigator.onLine) {
          content.classList.add("no-bots");

          content.innerHTML = `
            <i class="fas fa-wifi" style="
              font-size: 5rem;
              margin-bottom: 1.5rem;
              opacity: 0.8;
            "></i>
            <p style="opacity: 0.8; margin-bottom: 0.6rem;">No Internet Connection</p>
          `;
        } else if (this.bots.length) {
          content.classList.add("no-bots");

          content.innerHTML = `
            <i class="fas fa-spin fa-spinner" style="
              font-size: 5rem;
              margin-bottom: 1.5rem;
              opacity: 0.8;
            "></i>
            <p style="opacity: 0.8; margin-bottom: 0.6rem;">Revolutionizing bot creation...</p>
          `;

          this.createStoreGrid().then((storeGrid) => {
            content.classList.remove("no-bots");
            content.innerHTML = "";

            content.appendChild(storeGrid);
          });
        } else {
          content.classList.add("no-bots");

          content.innerHTML = `
            <i class="fas fa-magnifying-glass" style="
              font-size: 5rem;
              margin-bottom: 1.5rem;
              opacity: 0.8;
            "></i>
            <p style="opacity: 0.8; margin-bottom: 0.6rem;">Yikes. So quiet here...</p>
            <button class="create-btn" style="
              width: 19.5ch;
              justify-content: center;
              white-space: nowrap;
            ">
              <i class="fas fa-plus"></i>Create Bot Now
            </button>
          `;
        };
        break;
      case "settings":
        document.querySelector(".app").style.removeProperty("background-color");
        content.classList.remove("no-bots");
        content.appendChild(this.createSettingsPanel());
        break;
      case "help":
        content.classList.remove("no-bots");
        content.appendChild(this.createHelpView());
        break;
    };

    mainContent.appendChild(content);
  };

  createHeader() {
    const header = document.createElement("header");
    header.className = "main-header";

    if (this.currentView === "bots") {
      header.innerHTML = `
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search bots..." />
        </div>
        <button class="create-btn">
          <i class="fas fa-plus"></i>
          Create Bot
        </button>
      `;
    } else if (this.currentView === "store") {
      header.innerHTML = `
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search bots..." />
        </div>
      `;
    } else {
      header.innerHTML = `
        <h2 class="view-title">${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}</h2>
      `;
    };

    return header;
  };

  createBotGrid() {
    const path = require("path");

    const grid = document.createElement("div");
    grid.className = "bot-grid";
    grid.id = "botGrid";

    const settings = JSON.parse(localStorage.getItem("settings") || "{}");

    this.bots.forEach((bot, index) => {
      const card = document.createElement("div");
      card.className = "bot-card";
      card.style.animationDelay = `${index * 0.1}s`;
      card.dataset.id = bot.id;

      const botStatus = this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/status.txt")) || "OFFLINE";
      const botStatistics = Object.fromEntries(
        (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/statistics.txt")) || "Servers: 0\nUsers: 0").split("\n").filter((line) => line).map((line) => {
          const [key, value] = line.split(":").map((part) => part.trim());
          return [key.toLowerCase(), Number(value)];
        })
      );
      const statusColor = (botStatus.toLowerCase() === "online") ? "var(--discord-green)" : "var(--discord-red)";

      card.innerHTML = `
        <div class="bot-header" ${(settings.showStats ?? true) ? "" : `style="margin-bottom: 0;"`}>
          <div class="bot-avatar"${(((this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖") === "🤖") ? ` style="font-size: 42.5px;"` : ""}>${(this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖"}</div>
          <div class="bot-info">
            <h3${(!bot.description) ? ' style="font-size: 1.2rem; margin-left: 2.5px;"' : ""}>${this.escapeHtml(bot.name)}</h3>
            <p>${this.escapeHtml(bot.description)}</p>
          </div>
          <div class="bot-actions">
            <button class="action-btn code-btn" title="Open Workspace">
              <i class="fas fa-code"></i>
            </button>
            <button class="action-btn edit-btn" title="Edit Bot">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete Bot">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="bot-stats" ${(settings.showStats ?? true) ? "" : `style="display: none;"`}>
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="color: ${statusColor};">
              <i class="fas fa-circle" style="font-size: 0.75rem; transform: translateY(-2.5px);"></i>
              ${botStatus.charAt(0).toUpperCase() + botStatus.slice(1).toLowerCase()}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Servers</div>
            <div class="stat-value">${this.formatNumber(Number(botStatistics.servers))}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Users</div>
            <div class="stat-value">${this.formatNumber(Number(botStatistics.users))}</div>
          </div>
        </div>
      `;

      if ((fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels")) || []).includes("status.txt")) {
        if (!this.statusWatchers) (this.statusWatchers = []);
        this.statusWatchers.push(fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), "channels/status.txt"), (eventType) => {
          if (eventType !== "change") return;

          const newStatus = this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/status.txt")) || "OFFLINE";
          card.querySelector(".bot-stats .stat-value").style.color = (newStatus.toLowerCase() === "online") ? "var(--discord-green)" : "var(--discord-red)";
          card.querySelector(".bot-stats .stat-value").childNodes[2].textContent = ` ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase()}`;

          if (JSON.parse(localStorage.getItem("settings") || "{}").statusNotifications) {
            const title = (newStatus.toLowerCase() === "online") ? `✅ ${bot.name} Started` : `❌ ${bot.name} Stopped`;

            const body = (newStatus.toLowerCase() === "online") ? `🟢 ${bot.name} is now running and connected. 🟢` : `🔴 ${bot.name} has stopped or crashed. 🔴`;

            new Notification(title, {
              body
            });
          };
        }));
      };

      if ((fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels")) || []).includes("statistics.txt")) {
        if (!this.statisticsWatchers) (this.statisticsWatchers = []);
        this.statisticsWatchers.push(fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), "channels/statistics.txt"), (eventType) => {
          if (eventType !== "change") return;

          const newStatistics = Object.fromEntries(
            (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/statistics.txt")) || "Servers: 0\nUsers: 0").split("\n").filter((line) => line).map((line) => {
              const [key, value] = line.split(":").map((part) => part.trim());
              return [key.toLowerCase(), Number(value)];
            })
          );
          card.querySelectorAll(".bot-stats .stat-value")[1].textContent = this.formatNumber(Number(newStatistics.servers));
          card.querySelectorAll(".bot-stats .stat-value")[2].textContent = this.formatNumber(Number(newStatistics.users));
        }));
      };

      if ((fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels")) || []).includes("error.txt")) {
        fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), "channels/error.txt"), (eventType) => {
          try {
            if ((eventType !== "change") || !(JSON.parse(localStorage.getItem("settings") || "{}").errorNotifications) || (Number((fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/error.txt"), "utf8") || "").split("\n")[0]) === this.lastError)) return;

            this.lastError = Number((fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/error.txt"), "utf8") || "").split("\n")[0]);

            new Notification(`⚠️ Error in ${bot.name} ⚠️`, {
              body: (fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/error.txt"), "utf8") || "").split("\n").slice(1).join("\n") || "Unknown error occured"
            });
          } catch {};
        });
      };

      if ((fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels")) || []).includes("dialog.txt")) {
        fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), (eventType) => {
          try {
            if ((eventType !== "change") || (Number((fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), "utf8") || "").split("\n")[0]) === this.lastDialog) || !["alert", "confirm", "prompt"].includes((fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), "utf8") || "").split("\n")[1])) return;

            let id = Number((fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), "utf8") || "").split("\n")[0]);
            this.lastDialog = id;

            this[(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), "utf8") || "").split("\n")[1]](...JSON.parse((fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), "utf8") || "").split("\n").slice(2).join("\n") || "[]")).then((...result) => {
              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), id + "\nresponseResolve\n" + JSON.stringify(result), "utf8");
            }).catch((...error) => {
              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/dialog.txt"), id + "\nresponseReject\n" + JSON.stringify(error), "utf8");
            });
          } catch {};
        });
      };

      const codeBtn = card.querySelector(".code-btn");
      const editBtn = card.querySelector(".edit-btn");
      const deleteBtn = card.querySelector(".delete-btn");

      codeBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        this.showCodeEditor(bot);
      });

      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        this.showBotEditor(bot);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        this.confirm("Delete Bot", `Are you sure about deleting ${this.escapeHtml(bot.name)}?`, "dangerous").then(() => {
          this.prompt("Delete Bot", "Enter bot name...", "dangerous").then((botName) => {
            if (botName !== bot.name) return;

            this.bots = this.bots.filter((b) => b.id !== bot.id);
            this.saveBots();
            this.renderContent();

            this.saveBots();
            this.renderContent();

            ipcRenderer.send("closeTerminal", bot.id);

            const path = require("path");

            fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString()));
          }).catch(() => {});
        }).catch(() => {});
      });

      grid.appendChild(card);
    });

    return grid;
  };

  createStoreGrid() {
    return new Promise((resolve, reject) => {
      fetch(process.env.SERVER + "/api/v1/store/all")
      .then((response) => response.json())
      .then((store) => {
        if (store.version === "1") {
          const path = require("path");

          const grid = document.createElement("div");
          grid.className = "bot-grid";
          grid.id = "botGrid";

          const settings = JSON.parse(localStorage.getItem("settings") || "{}");

          Object.entries(store).filter(([id]) => !["version", "activity"].includes(id)).forEach(([id, bot], index) => {
            bot = {
              id: id || "",
              avatar: bot[0] || "🤖",
              name: bot[1] || "",
              description: bot[2] || "",
              repository: bot[3] || "",
              verified: bot[4] || false,
              installs: bot[5] || 0,
              likes: bot[6] || 0
            };

            const card = document.createElement("div");
            card.className = "bot-card";
            card.style.animationDelay = `${index * 0.1}s`;
            card.dataset.id = bot.id;

            card.innerHTML = `
              <div class="bot-header" ${(settings.showStats ?? true) ? "" : `style="margin-bottom: 0;"`}>
                <div class="bot-avatar"${(((this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖") === "🤖") ? ` style="font-size: 42.5px;"` : ""}>${(this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖"}</div>
                <div class="bot-info">
                  <h3${(!bot.description) ? ' style="font-size: 1.2rem; margin-left: 2.5px;"' : ""}>${this.escapeHtml(bot.name)}</h3>
                  <p>${this.escapeHtml(bot.description)}</p>
                </div>
                <div class="bot-actions">
                  <button class="action-btn view-btn" title="View Bot">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="action-btn install-btn" title="Install Bot">
                    <i class="fas fa-download"></i>
                  </button>
                  <button class="action-btn report-btn" title="Report Bot">
                    <i class="fas fa-flag"></i>
                  </button>
                </div>
              </div>
              <div class="bot-stats" ${(settings.showStats ?? true) ? "" : `style="display: none;"`}>
                <div class="stat">
                  <div class="stat-label">Status</div>
                  <div class="stat-value" style="color: ${(bot.verified) ? "#00adff" : "var(--discord-muted)"}; white-space: nowrap;">
                    <i class="fas fa-circle-${(bot.verified) ? "check" : "xmark"}" style="margin-right: 2.5px;"></i>
                    ${(bot.verified) ? "Verified" : "Unverified"}
                  </div>
                </div>
                <div class="stat" style="margin-left: 10%;">
                  <div class="stat-label">Installs</div>
                  <div class="stat-value">${this.formatNumber(bot.installs)}</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Likes</div>
                  <div class="stat-value">${this.formatNumber(bot.likes)}</div>
                </div>
              </div>
            `;

            const viewBtn = card.querySelector(".view-btn");
            const installBtn = card.querySelector(".install-btn");
            const reportBtn = card.querySelector(".report-btn");

            viewBtn.addEventListener("click", (e) => {
              e.stopPropagation();

              this.viewBot(bot);
            });

            installBtn.addEventListener("click", (e) => {
              e.stopPropagation();

              this.confirm("Install Bot", (bot.verified) ? "Installing bots can be dangerous even if they are verified since bot owners can change the codebase of their bots whenever they want to.\nㅤ\nAre you sure you want to install this bot?" : "Unverified bots can contain malicious code.\nㅤ\nAre you sure you want to install this bot?").then(() => {
                this.prompt("Install Bot", "Enter token...").then((token) => {
                  const newBot = {
                    id: Date.now(),
                    avatar: bot.avatar,
                    name: bot.name,
                    description: bot.description || "",
                    initialized: false,
                    features: [],
                    vanityLinks: []
                  };

                  const path = require("path");

                  let replacedToken = false;

                  this.bots.push(newBot);
                  this.initializeTemplate(newBot, `git:${bot.repository}`).then(() => {
                    if (fs.existsSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"))) {
                      fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"), fs.readFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"), "utf8").split("\n").map((line) => {
                        if (replacedToken) return line;

                        if (line.split(/#|\/\//)[0].match(/^\s*TOKEN\s*=/)) {
                          replacedToken = true;
                          return line.replace(/^\s*TOKEN\s*=.*?(#|\/\/|$)/, `TOKEN="${token}" $1`).trim();
                        };

                        return line;
                      }).join("\n"), "utf8");
                    };
                  });

                  this.saveBots();
                  this.currentView = "bots";
                  this.renderContent();
                  Array.from(document.querySelectorAll(".nav-item")).find((navItem) => navItem.querySelector("i").className === "fas fa-robot").classList.add("active");

                  fetch(process.env.SERVER + "/api/v1/store/install", {
                    method: "POST",
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      id: bot.id
                    })
                  }).catch(() => {});
                }).catch(() => {});
              }).catch(() => {});
            });

            reportBtn.addEventListener("click", (e) => {
              e.stopPropagation();

              this.reportBot(bot);
            });

            grid.appendChild(card);
          });

          resolve(grid);
        };
      }).catch(() => {});
    });
  };

  showFeedbackModal() {
    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Send Feedback</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group" style="
              display: flex;
              flex-direction: row;
              justify-content: center;
            ">
              <i class="feedback-star"></i>
              <i class="feedback-star"></i>
              <i class="feedback-star"></i>
              <i class="feedback-star"></i>
              <i class="feedback-star"></i>
            </div>
            <div class="form-group">
              <label for="feedbackUser">E-Mail / Discord Username</label>
              <input type="text" id="feedbackUser" placeholder="@JohnDoe123" required>
            </div>
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label for="feedbackComment">Comment (optional)</label>
              <textarea id="feedbackComment"></textarea>
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn">
                Send Feedback
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    Array.from(modal.querySelectorAll(".feedback-star")).forEach((feedbackStar, index) => {
      feedbackStar.addEventListener("mouseenter", () => {
        Array.from(modal.querySelectorAll(".feedback-star")).slice(0, index + 1).forEach((hoveredFeedbackStar) => {
          hoveredFeedbackStar.classList.add("hovered-feedback-star");
        });
      });

      feedbackStar.addEventListener("mouseleave", () => {
        Array.from(modal.querySelectorAll(".feedback-star")).slice(0, index + 1).forEach((hoveredFeedbackStar) => {
          hoveredFeedbackStar.classList.remove("hovered-feedback-star");
        });
      });

      feedbackStar.addEventListener("click", () => {
        Array.from(modal.querySelectorAll(".selected-feedback-star")).forEach((selectedFeedbackStar) => {
          selectedFeedbackStar.classList.remove("selected-feedback-star");
        });

        Array.from(modal.querySelectorAll(".feedback-star")).slice(0, index + 1).forEach((selectedFeedbackStar) => {
          selectedFeedbackStar.classList.add("selected-feedback-star");
        });
      });
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);

      if (Array.from(document.querySelectorAll(".nav-item")).find((navItem) => navItem.classList.contains("currentView"))) {
        document.querySelectorAll(".nav-item").forEach((navItem) => {
          navItem.classList.remove("active");
          if (Array.from(navItem.classList).includes("currentView")) {
            navItem.classList.remove("currentView");
            navItem.classList.add("active");
          };
        });
      };
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!navigator.onLine) return (closeModal(), this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!"));

      fetch(process.env.FEEDBACK_WEBHOOK, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [
            {
              title: "📝 Feedback",
              color: 0x00b0f4,
              fields: [
                ...[
                  {
                    name: "Rating",
                    value: `${"⭐".repeat(modal.querySelectorAll(".selected-feedback-star").length)} (${modal.querySelectorAll(".selected-feedback-star").length}/5)`,
                    inline: true
                  },
                  {
                    name: "User",
                    value: modal.querySelector("#feedbackUser").value || "Anonymous",
                    inline: true
                  }
                ],
                ...(modal.querySelector("#feedbackComment").value) ? [
                  {
                    name: "Comment",
                    value: modal.querySelector("#feedbackComment").value
                  }
                ] : []
              ],
              timestamp: new Date().toISOString()
            }
          ]
        })
      }).catch(() => {});

      closeModal();
    });
  };

  createSettingsPanel() {
    const path = require("path");

    const storedSettings = JSON.parse(localStorage.getItem("settings") || "{}");

    const settings = document.createElement("div");
    settings.className = "settings-panel";

    settings.innerHTML = `
      <div class="settings-section">
        <h3><i class="fas fa-palette"></i>Appearance</h3>
        <div class="setting-item">
          <label data-tooltip="Choose between dark and light theme">
            Theme
            <select id="themeSelect">
              <option value="discord" ${((storedSettings.theme || "discord") === "discord") ? "selected" : ""}>Discord</option>
              <option value="space" ${((storedSettings.theme || "discord") === "space") ? "selected" : ""}>Space</option>
              <option value="serenity" ${((storedSettings.theme || "discord") === "serenity") ? "selected" : ""}>Serenity</option>
              <option value="monokai" ${((storedSettings.theme || "discord") === "monokai") ? "selected" : ""}>Monokai</option>
              <option value="celestial" ${((storedSettings.theme || "discord") === "celestial") ? "selected" : ""}>Celestial</option>
            </select>
          </label>
          <div class="setting-description">
            Customize the look and feel of your LocalBotify application
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Show or hide bot statistics">
            <span>Show Statistics</span>
            <input type="checkbox" id="showStats" ${((storedSettings.showStats ?? true) ? "checked" : "")}/>
          </label>
          <div class="setting-description">
            Display server count and user statistics on bot cards
          </div>
        </div>
      </div>

      ${(window.isSecureContext && "credentials" in navigator && (typeof navigator.credentials.create === "function") && (typeof PublicKeyCredential === "function")) ? `<div class="settings-section">
        <h3><i class="fas fa-shield-halved"></i>Security</h3>
        <div class="setting-item">
          <label data-tooltip="This will not protect your tokens, only the GUI">
            <span>App Lock</span>
            <input type="checkbox" id="appLock" ${((storedSettings.appLock) ? "checked" : "")}/>
          </label>
          <div class="setting-description">
            Only allow access once verified
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Keep attackers from stealing your tokens">
            <span>Environment Encryption</span>
            <input type="checkbox" id="environmentEncryption" ${((storedSettings.encryptionPassword) ? "checked" : "")}/>
          </label>
          <div class="setting-description">
            Encrypt your bots' dotenv files
          </div>
        </div>
      </div>` : ""}

      <div class="settings-section">
        <h3><i class="fas fa-code"></i>Developer Settings</h3>
        <div class="setting-item">
          <label data-tooltip="Default prefix for new bots">
            Default Bot Prefix
            <input type="text" id="defaultPrefix" value="${storedSettings.defaultPrefix ?? "!"}" placeholder="Enter prefix..." />
          </label>
          <div class="setting-description">
            Set the default command prefix for newly created bots
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Enable development mode">
            <span>Developer Mode</span>
            <input type="checkbox" id="devMode" ${(storedSettings.devMode) ? "checked" : ""}/>
          </label>
          <div class="setting-description">
            Show additional debugging information and developer tools
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3><i class="fas fa-bell"></i>Notifications</h3>
        <div class="setting-item">
          <label data-tooltip="Get notified about errors">
            <span>Error Notifications</span>
            <input type="checkbox" id="errorNotifications" ${(storedSettings.errorNotifications) ? "checked" : ""}/>
          </label>
          <div class="setting-description">
            Receive notifications when errors occur
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Get notified about status changes">
            <span>Status Notifications</span>
            <input type="checkbox" id="statusNotifications" ${(storedSettings.statusNotifications) ? "checked" : ""}/>
          </label>
          <div class="setting-description">
            Receive notifications when bot status changes
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Get notified about updates">
            <span>Announcement Notifications</span>
            <input type="checkbox" id="announcementNotifications" ${(storedSettings.announcementNotifications ?? true) ? "checked" : ""}/>
          </label>
          <div class="setting-description">
            Receive notifications about new announcements
          </div>
        </div>
      </div>

      <div id="upgradeForm" class="settings-section" style="margin-bottom: 0;">
        <h3><i class="fas fa-trophy"></i>Pro Plan</h3>
        <button id="activateProToken" class="submit-btn" style="width: 100%; margin-top: -0.25rem; padding-top: 0.75rem; padding-bottom: 0.75rem; border-radius: var(--radius-md);">
          <i class="fas fa-trophy" style="margin-right: 7.5px;"></i>Activate using token
        </button>
      </div>

      <button class="settings-save-btn">
        <i class="fas fa-save"></i>
        Save Changes
      </button>
    `;

    let currentAppLockId = storedSettings.appLock || false;

    if (window.isSecureContext && "credentials" in navigator && (typeof navigator.credentials.create === "function") && (typeof PublicKeyCredential === "function")) {
      settings.querySelector("#appLock").addEventListener("click", (e) => {
        if (!settings.querySelector("#appLock").checked) return;
        if (!navigator.onLine) return this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!").then(() => {
          settings.querySelector("#appLock").checked = false
        });

        const blockade = document.createElement("div");
        blockade.style.position = "absolute";
        blockade.style.top = "0";
        blockade.style.left = "0";
        blockade.style.width = "100vw";
        blockade.style.height = "100vh";
        blockade.style.zIndex = "999";

        document.body.appendChild(blockade);

        const embed = window.open(process.env.SERVER + "/appLock", "_blank", "show=no");

        window.addEventListener("message", ({ data: { type, id } = {} }) => {
          if (type === "ready") {
            embed.postMessage({
              type: "create"
            }, "*");
          } else if (type === "create") {
            blockade.remove();
            embed.close();

            currentAppLockId = id;
          } else if (type === "error") {
            blockade.remove();
            embed.close();

            settings.querySelector("#appLock").checked = false;
          };
        });
      });
    };

    settings.querySelector("#activateProToken").addEventListener("click", () => {
      if (!navigator.onLine) return this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");

      this.prompt("Activate LocalBotify Pro", "Enter token...").then((token) => {
        fetch(process.env.SERVER + "/api/v1/pro/activate", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token
          })
        })
        .then((response) => response.json())
        .then(({ err, file }) => {
          if (err) return this.showToast(err, "error");

          fs.writeFileSync(path.join(process.cwd(), "index.pro.html"), `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>LocalBotify</title>
                <link rel="stylesheet" href="./style.css" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
                <script defer type="module" src="${path.join(process.cwd(), "script.pro.js")}"></script>
              </head>
              <body>
                <div class="app">
                  <aside class="sidebar">
                    <div class="sidebar-header">
                      <i class="fab fa-discord"></i>
                      <h2>LocalBotify</h2>
                    </div>
                    <nav class="sidebar-nav">
                      <button class="nav-item active">
                        <i class="fas fa-robot"></i>
                        <span>My Bots</span>
                      </button>
                      <button class="nav-item">
                        <i class="fas fa-plus"></i>
                        <span>Create New</span>
                      </button>
                      <button class="nav-item">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Bot Store</span>
                      </button>
                      <button class="nav-item" style="margin-top: calc(100vh - 417.5px);">
                        <i class="fas fa-comments"></i>
                        <span>Feedback</span>
                      </button>
                      <button class="nav-item">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                      </button>
                      <button class="nav-item">
                        <i class="fas fa-question-circle"></i>
                        <span>Help</span>
                      </button>
                    </nav>
                  </aside>
                  <div class="sidebar-resizer"></div>
                  <main class="main-content">
                    <header class="main-header">
                      <div class="search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search bots..." />
                      </div>
                      <button class="create-btn">
                        <i class="fas fa-plus"></i>
                        Create Bot
                      </button>
                    </header>

                    <div class="bot-grid" id="botGrid"></div>
                  </main>
                </div>
              </body>
            </html>
          `, "utf8");

          fs.writeFileSync(path.join(process.cwd(), "script.pro.js"), file, "utf8");
        });
      }).catch(() => {});
    });

    const saveBtn = settings.querySelector(".settings-save-btn");
    saveBtn.addEventListener("click", () => {
      const updatedSettings = JSON.stringify({
        theme: document.getElementById("themeSelect").value,
        showStats: document.getElementById("showStats").checked,
        appLock: (settings.querySelector("#appLock").checked) ? (currentAppLockId || false) : false,
        defaultPrefix: document.getElementById("defaultPrefix").value,
        devMode: document.getElementById("devMode").checked,
        errorNotifications: document.getElementById("errorNotifications").checked,
        statusNotifications: document.getElementById("statusNotifications").checked,
        announcementNotifications: document.getElementById("announcementNotifications").checked
      });

      localStorage.setItem("settings", updatedSettings);
      this.updateSettings();

      saveBtn.innerHTML = `<i class="fas fa-check"></i>Saved!`;
      saveBtn.style.backgroundColor = "var(--discord-green)";

      setTimeout(() => {
        saveBtn.innerHTML = `<i class="fas fa-save"></i>Save Changes`;
        saveBtn.style.backgroundColor = "var(--discord-primary)";
      }, 2000);

    });

    return settings;
  };

  updateSettings() {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");

    document.querySelectorAll(".theme").forEach((themeStylesheet) => {
      themeStylesheet.remove();
    });

    if (settings.theme && (settings.theme !== "discord")) {
      let theme = document.createElement("link");
      theme.rel = "stylesheet";
      theme.href = `../themes/${settings.theme}.css`;
      theme.className = "theme";

      document.head.appendChild(theme);
    };

    try {
      if (!this.isPackaged || settings.devMode) {
        if (!window.LocalBotify) {
          window.LocalBotify = app;
        };
      } else {
        if (window.LocalBotify) {
          delete window.LocalBotify;
        };
      };
    } catch {};
  };

  createHelpView() {
    const path = require("path");
    const childProcess = require("child_process");

    const helpView = document.createElement("div");
    helpView.className = "help-view show";

    helpView.innerHTML = `
      <div class="help-explorer">
        <div class="help-tree">${this.renderFileTree(this.generateFileTree((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/docs") : "./docs"), true)}</div>
      </div>

      <div class="markdown-body" style="padding: 50px; overflow-y: auto;"></div>
    `;

    helpView.querySelectorAll(".help-tree .folder-content").forEach((folderContent) => {
      folderContent.style.display = "block";
    });

    document.querySelector(".app").style.backgroundColor = "#0d1117";

    ipcRenderer.invoke("parseMarkdown", this.escapeHtml(fs.readFileSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/docs/User Guide/Getting Started.md") : path.join(__dirname, "../docs/User Guide/Getting Started.md"), "utf8"))).then((parsedMarkdown) => {
      helpView.querySelector(".markdown-body").innerHTML = parsedMarkdown;

      helpView.querySelectorAll(".markdown-body a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();

          childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + e.target.href + `"`, (process.platform === "win32") ? {
            shell: "powershell.exe"
          } : {});
        });
      });

      if (parsedMarkdown.match(/<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/gs)) {
        ipcRenderer.invoke("highlightSyntax", parsedMarkdown).then((syntaxHighlightedMarkdown) => {
          helpView.querySelector(".markdown-body").innerHTML = syntaxHighlightedMarkdown;
        });
      };
    });

    this.getFileTreeItem(helpView, "User Guide/Getting Started.md").classList.add("active");

    this.setupHelpTreeListeners(helpView);

    if (!document.querySelector(".markdown-stylesheet")) {
      const markdownStylesheet = document.createElement("link");
      markdownStylesheet.rel = "stylesheet";
      markdownStylesheet.href = "../packages/github-markdown/github-markdown-dark.css";
      markdownStylesheet.className = "markdown-stylesheet";

      document.head.appendChild(markdownStylesheet);
    };

    return helpView;
  };

  loadCodeEditor(editorView, bot = null) {
    if (document.querySelectorAll(".code-editor-script").length) {
      document.querySelectorAll(".code-editor-script").forEach((codeEditorScript) => {
        codeEditorScript.remove();
      });
    };

    [
      "codemirror.css",
      "theme/monokai.css"
    ].forEach((codeEditorStylesheetSource) => {
      let codeEditorStylesheet = document.createElement("link");
      codeEditorStylesheet.rel = "stylesheet";
      codeEditorStylesheet.href = "../packages/codemirror/" + codeEditorStylesheetSource;
      codeEditorStylesheet.className = "code-editor-script";
      document.head.appendChild(codeEditorStylesheet);
    });

    let codeEditorScript = document.createElement("script");
    codeEditorScript.defer = true;
    codeEditorScript.src = "../packages/codemirror/codemirror.js";
    codeEditorScript.className = "code-editor-script";
    codeEditorScript.addEventListener("load", () => {
      let codeEditorModeScript = document.createElement("script");
      codeEditorModeScript.defer = true;
      codeEditorModeScript.src = "../packages/codemirror/mode/javascript/javascript.js";
      codeEditorModeScript.className = "code-editor-script";
      codeEditorModeScript.addEventListener("load", () => {
        const path = require("path");

        this.editor = CodeMirror.fromTextArea(editorView.querySelector(".code-editor-view textarea"), {
          mode: "javascript",
          theme: "monokai",
          styleActiveLine: true,
          lineNumbers: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          autoCloseTags: true
        });

        this.editor.on("change", (_, change) => {
          editorView.querySelector(".editor-play-btn").style.right = (this.editor.getScrollerElement().scrollHeight > this.editor.getScrollerElement().clientHeight) ? "calc(0.5rem + 5px)" : "calc(0.5rem - 2.5px)";

          if (change.origin === "setValue") return;

          const activeFile = editorView.querySelector(".file-tree-item.active-file");

          if (activeFile) {
            fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(activeFile)), this.editor.getValue(), "utf8");
          };
        });

        if (this.editor.getScrollerElement().scrollHeight > this.editor.getScrollerElement().clientHeight) (editorView.querySelector(".editor-play-btn").style.right = "calc(0.5rem + 5px)");
      });
      document.head.appendChild(codeEditorModeScript);
    });
    document.head.appendChild(codeEditorScript);
  };

  createTerminal(bot = null) {
    ipcRenderer.send("openTerminal", bot.id);

    let stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "../node_modules/@xterm/xterm/css/xterm.css";

    let script = document.createElement("script");
    script.defer = true;
    script.src = "../node_modules/@xterm/xterm/lib/xterm.js";
    script.addEventListener("load", () => {
      let character = document.createElement("span");
      character.textContent = "W";
      character.style.visibility = "hidden";
      character.style.position = "absolute";
      character.style.fontFamily = "Consolas, courier-new, courier, monospace";
      character.style.fontSize = "15px";
      document.body.appendChild(character);

      let terminal = new Terminal({
        cols: Math.floor((document.querySelector(".editor-terminal").clientWidth - 24) / character.getBoundingClientRect().width),
        rows: Math.round(200 / 17)
      });

      let currentLine = "";

      ipcRenderer.send("resizeTerminal", [bot.id, Math.floor((document.querySelector(".editor-terminal").clientWidth - 24) / character.getBoundingClientRect().width)]);

      document.body.removeChild(character);

      terminal.open(document.querySelector(".editor-terminal"));

      terminal.onKey((data) => {
        currentLine += data.key;
        ipcRenderer.send("terminalData", [
          bot.id,
          data.key
        ]);
      });

      terminal.attachCustomKeyEventHandler((e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "c")) {
          if (terminal.getSelection()) {
            navigator.clipboard.writeText(terminal.getSelection());
            return false;
          };

          return true;
        };

        return true;
      });

      window.addEventListener("resize", () => {
        if (!document.querySelector(".editor-terminal")) return;

        let character = document.createElement("span");
        character.textContent = "W";
        character.style.visibility = "hidden";
        character.style.position = "absolute";
        character.style.fontFamily = "Consolas, courier-new, courier, monospace";
        character.style.fontSize = "15px";
        document.body.appendChild(character);

        terminal.resize(Math.floor((document.querySelector(".editor-terminal").clientWidth - 24) / character.getBoundingClientRect().width), terminal.rows);

        ipcRenderer.send("resizeTerminal", [bot.id, Math.floor((document.querySelector(".editor-terminal").clientWidth - 24) / character.getBoundingClientRect().width)]);

        document.body.removeChild(character);
      });

      ipcRenderer.on("terminalData", (_, [botId, data]) => {
        if (botId !== bot.id) return;
        try {
          terminal.write(data);
        } catch {};
      });
    });

    document.head.appendChild(stylesheet);
    document.head.appendChild(script);
  };

  async showCodeEditor(bot = null) {
    const path = require("path");

    const workspaceView = document.createElement("div");
    workspaceView.className = "workspace-view";

    let configFile = JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")) || `
      {
        "prefix": "!",
        "slashCommands": "true",
        "status": [
          "Online",
          "Custom",
          "Powered by LocalBotify.app"
        ],
        "footer": "Powered by LocalBotify.app",
        "commands": {
          "initialization": null,
          "startup": ".\\node . "
        },
        "variables": {
          "commands": {},
          "events": {}
        }
      }
    `);

    workspaceView.innerHTML = `
      <div class="workspace-tabs">
        <button class="active currentView">
          <i class="fas fa-tools"></i>
          Workbench
        </button>
        <button>
          <i class="fas fa-code"></i>
          Code Lab
        </button>
        <button>
          <i class="fas fa-trophy"></i>
          Pro Suite
        </button>
      </div>

      <button class="workspace-close-btn">
        <i class="fas fa-times"></i>
      </button>

      <div class="workbench-view">
        <div id="workbenchMainView" style="animation: slideUp 0.5s ease;">
          <div class="bot-header" style="margin-bottom: 1.65rem;">
            <div class="bot-avatar" style="width: 60px; height: 60px; font-size: ${(50 - ((((this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖") === "🤖") * 2.5)).toString()}px;">${(this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖"}</div>
            <div class="bot-info" style="margin-top: 2px; margin-left: -${(8.5 + ((((this.isEmoji(bot.avatar)) ? this.escapeHtml(bot.avatar) : "🤖") === "🤖") * 0.75)).toString()}px;">
              <h3 style="font-size: 1.5rem; margin-left: 2.5px;">${this.escapeHtml(bot.name)}</h3>
              <p style="font-size: 0.95rem; margin-left: 2.5px; margin-top: -2.5px;">${(bot.description) ? this.escapeHtml(bot.description) : ""}</p>
            </div>
            <div style="
              position: absolute;
              right: 4rem;
              display: flex;
            ">
              <button id="workbench-play-btn" class="workbench-action-btn" style="margin-right: 7.25px;">
                ${(((this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/process.txt")) || "OFFLINE").trim() || "OFFLINE") === "OFFLINE") ? `<i class="fas fa-play"></i>Run` : `<i class="fas fa-stop"></i>Stop`}
              </button>
              <button id="workbench-invite-btn" class="workbench-action-btn" style="padding: 0.5rem 0.575rem; margin-right: 7.25px;">
                <i class="fas fa-link"></i>
              </button>
              <button id="workbench-publish-btn" class="workbench-action-btn" style="padding: 0.5rem 0.65rem; margin-right: 7.25px;">
                <i class="fas fa-upload"></i>
              </button>
              <button id="workbench-settings-btn" class="workbench-action-btn" style="padding: 0.5rem 0.65rem;">
                <i class="fas fa-cog"></i>
              </button>
            </div>
          </div>
          <div class="setting-item" style="margin-bottom: 0.85rem;">
            <label data-tooltip="Enable classic !commands and modern /commands with autocomplete">
              <span>Prefix</span>
              <input type="text" id="botPrefix" placeholder="Enter prefix..." value="${this.escapeHtml(configFile.prefix)}" style="width: ${(2.75 + ((configFile.prefix.length - 1) * 0.5)).toString()}rem; text-align: center;">
              <span style="margin-left: 0.75rem;">Slash Commands</span>
              <input type="checkbox" id="slashCommands"${configFile.slashCommands ? " checked" : ""}>
            </label>
            <div class="setting-description">
              Personalize how your bot talks
            </div>
          </div>
          <div class="setting-item" style="margin-bottom: 0.85rem;">
            <label data-tooltip="Choose the status for your bot">
              <span>Bot Status</span>
              <select id="botStatusSymbol" style="width: fit-content; border-top-right-radius: 0; border-bottom-right-radius: 0;">
                <option value="Online" ${((configFile.status[0] || "Online") === "Online") ? "selected" : ""}>🟢</option>
                <option value="Idle" ${((configFile.status[0] || "Online") === "Idle") ? "selected" : ""}>🌙</option>
                <option value="DoNotDisturb" ${((configFile.status[0] || "Online") === "DoNotDisturb") ? "selected" : ""}>🔴</option>
                <option value="Invisible" ${((configFile.status[0] || "Online") === "Invisible") ? "selected" : ""}>🔘</option>
              </select>
              <select id="botStatusActivity" style="width: fit-content; border-radius: 0; margin-left: -0.75rem;">
                <option value="Playing" ${((configFile.status[1] || "Playing") === "Playing") ? "selected" : ""}>Playing</option>
                <option value="Watching" ${((configFile.status[1] || "Playing") === "Watching") ? "selected" : ""}>Watching</option>
                <option value="Listening" ${((configFile.status[1] || "Playing") === "Listening") ? "selected" : ""}>Listening</option>
                <option value="Competing" ${((configFile.status[1] || "Playing") === "Competing") ? "selected" : ""}>Competing</option>
                <option value="Streaming" ${((configFile.status[1] || "Playing") === "Streaming") ? "selected" : ""}>Streaming</option>
                <option value="Custom" ${((configFile.status[1] || "Playing") === "Custom") ? "selected" : ""}>Custom</option>
              </select>
              <input type="text" id="botStatusMessage" placeholder="Enter status..." value="${this.escapeHtml(configFile.status[2] || "")}" style="width: 14rem; margin-left: -0.75rem; border-top-left-radius: 0; border-bottom-left-radius: 0;" />
            </label>
            <div class="setting-description">
              Give your bot a personality
            </div>
          </div>
          <div class="setting-item" style="margin-bottom: 0.85rem;">
            <label data-tooltip="Show yourself using the footer">
              <span>Bot Embed Footer</span>
              <input type="text" id="botFooter" placeholder="Enter footer..."  value="${this.escapeHtml(configFile.footer || "")}" style="width: 14rem;" />
            </label>
            <div class="setting-description">
              Customize your bot embed footer
            </div>
          </div>
          <div class="workbench-section settings-section" style="
            padding: 1.5rem 2rem;
            margin-top: 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            transition: all 0.3s ease;
            border: 1px solid transparent;
            box-shadow: none;
          ">
            <h3 style="flex-direction: row; margin-bottom: 1rem;">
              <i class="fas fa-code"></i>Commands
              <button class="add-command-btn" style="right: 25px;">
                <i class="fas fa-plus"></i>
                Add Command
              </button>
            </h3>
            ${(!(fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "commands")) || []).length) ? `<span style="color: grey;">No commands found</span>` : fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "commands")).map((command) => (command.endsWith(".js")) ? `
              <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;" data-category="commands">${this.escapeHtml(command.substring(0, command.length - 3))}</div>
            ` : "").join("")}
            <h3 style="flex-direction: row; margin-bottom: 1rem; margin-top: 2rem;">
              <i class="fas fa-calendar-days"></i>Events
              <button class="add-command-btn" style="right: 25px;">
                <i class="fas fa-plus"></i>
                Add Event
              </button>
            </h3>
            ${(!(fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "events")) || []).length) ? `<span style="color: grey;">No events found</span>` : fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "events")).map((command) => (command.endsWith(".js")) ? `
              <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;" data-category="events">${this.escapeHtml(command.substring(0, command.length - 3).replace(/[^a-zA-Z]+$/, "")) + ((command.substring(0, command.length - 3).match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(command.substring(0, command.length - 3).match(/[^a-zA-Z]+$/))}</code>` : "")}</div>
            ` : "").join("")}
          </div>
        </div>

        <div id="workbenchEditorView" style="display: none; animation: slideUp 0.5s ease;"></div>
      </div>

      <div class="code-editor-view" style="visibility: hidden;">
        <div class="file-explorer">
          <div class="file-explorer-header">
            <span class="file-explorer-title">Files</span>
            <div class="file-explorer-actions">
              <button class="file-explorer-btn" title="New File">
                <i class="fas fa-plus"></i>
              </button>
              <button class="file-explorer-btn" title="New Folder">
                <i class="fas fa-folder-plus"></i>
              </button>
            </div>
          </div>
          <div class="file-tree">
            ${this.renderFileTree(this.generateFileTree(path.join(process.cwd(), "bots", bot.id.toString())))}
          </div>
        </div>

        <div class="editor-container">
          <button class="editor-play-btn">
            <i class="${(((this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/process.txt")) || "OFFLINE").trim() || "OFFLINE") === "OFFLINE") ? "fas fa-play" : "fas fa-stop"}"></i>
          </button>
          <div class="editor-content">
            <textarea spellcheck="false">${(fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString())).find((file) => !fs.statSync(path.join(process.cwd(), "bots", bot.id.toString(), file)).isDirectory())) ? this.escapeHtml(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), ((dir) => {
              const files = fs.readdirSync(dir);
              if (files.includes("index.js")) return "index.js";
              if (files.includes("package.json")) {
                try {
                  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                  if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
                  return "package.json";
                } catch {
                  return "package.json";
                };
              };
              const firstJsFile = files.find((file) => file.endsWith(".js"));
              if (firstJsFile) return firstJsFile;
              const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
              if (firstNonFolder) return firstNonFolder;
              const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
              if (firstFile) return firstFile.substring(2);
              return null;
            })(path.join(process.cwd(), "bots", bot.id.toString()))), "utf8")) : ""}</textarea>
            ${(!fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString())).find((file) => !fs.statSync(path.join(process.cwd(), "bots", bot.id.toString(), file)).isDirectory())) ? `
              <div class="editor-content-missing">
                <h2>No file found</h2>
                <div>
                  <button>
                    <i class="fas fa-plus"></i>
                    New File
                  </button>
                  <button>
                    <i class="fas fa-plus"></i>
                    New Folder
                  </button>
                </div>
              </div>
            ` : ""}
          </div>
        </div>

        <div class="editor-terminal"></div>
      </div>

      <div class="workbench-view suite-view">
        <div id="suiteMainView">
          <div id="assistantSection" class="workbench-section settings-section" style="
            padding: 1.5rem 2rem;
            margin-top: 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            transition: all 0.3s ease;
            border: 1px solid transparent;
            box-shadow: none;
            overflow-x: auto;
            overflow-y: hidden;
          ">
            <h3 style="flex-direction: row; margin-bottom: 1rem;">
              <i class="fas fa-robot"></i>AI Assistant
            </h3>
            <div class="command-item setting-item" style="padding: 0; background-color: transparent;">
              <form>
                <div style="display: flex; flex-direction: row;">
                  <select style="margin-top: 0.35rem; margin-bottom: 0.5rem; margin-right: 0.625rem; min-height: 3.15rem; font-family: system-ui; background-color: #00000030; resize: vertical; cursor: pointer;">
                    <option style="background-color: #151618;" selected>Command</option>
                    <option style="background-color: #151618;">Event</option>
                  </select>
                  <input style="margin-top: 0.35rem; margin-bottom: 0.5rem; min-height: 3.15rem; font-family: system-ui; background-color: #00000030; resize: vertical;" placeholder="Enter command name..." required>
                </div>
                <textarea style="margin-top: 0.25rem; height: 150px; min-height: 3.15rem; font-family: system-ui; background-color: #00000030; resize: vertical;" placeholder="Enter prompt..."></textarea>
                <button type="submit" class="generate-btn" style="margin-top: 0.5rem; margin-bottom: 0.375rem; background-color: #b7841d; resize: vertical; cursor: pointer; font-family: cursive; height: 2.55rem; display: flex; justify-content: center; align-items: center; font-size: 15px; box-shadow: 0 4px 10px rgb(255 215 0 / 16%);" placeholder="Enter prompt...">
                  <span style="margin-bottom: 2.25px;">Generate <span style="margin-left: 2.5px;">🪄</span></span>
                </button>
              </form>
            </div>
          </div>
          <div id="collaborationSection" class="workbench-section settings-section" style="
            padding: 1.5rem 2rem;
            margin-top: 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            transition: all 0.3s ease;
            border: 1px solid transparent;
            box-shadow: none;
            overflow-x: auto;
            overflow-y: hidden;
          ">
            <h3 style="flex-direction: row; margin-bottom: 1rem;">
              <i class="fas fa-user-group"></i>Collaboration
            </h3>
            <span class="missing-internet-connection" style="display: ${(navigator.onLine) ? "none" : "block"}; color: grey;">No Internet Connection</span>
            <div class="private-join-link" style="display: ${(navigator.onLine) ? "block" : "none"};">
              <div class="setting-item" style="margin-top: 20px; margin-bottom: 0.25rem;">
                <label data-tooltip="Develop your bot together with your friends">
                  <span>Private Join Link</span>
                  <input type="checkbox" id="privateJoinLink"${((this.collaborationSessions || {})[bot.id.toString()]) ? " checked" : ""}>
                </label>
                <div class="setting-description">
                  Anyone with this link can edit files
                </div>
              </div>
              <div class="command-item setting-item" style="display: ${((this.collaborationSessions || {})[bot.id.toString()]) ? "block" : "none"}; padding: 0; background-color: transparent;">
                <div style="display: flex; flex-direction: row;">
                  <input style="margin-top: 0.35rem; margin-bottom: 0.375rem; min-height: 3.15rem; font-family: system-ui; background-color: #00000030; border-top-right-radius: 0; border-bottom-right-radius: 0;" ${((this.collaborationSessions || {})[bot.id.toString()]) ? `value="${this.escapeHtml(`${process.env.SERVER}/sessions/${encodeURIComponent((this.collaborationSessions || {})[bot.id.toString()])}`)}" ` : ""}readonly>
                  <button class="copy-btn" style="border: 2px solid transparent; padding: 0.75rem 1rem; border-top-left-radius: 0; border-top-right-radius: var(--radius-md); border-bottom-left-radius: 0; border-bottom-right-radius: var(--radius-md); color: var(--discord-text); width: fit-content; font-size: 0.95rem; transition: all 0.2s ease; margin-top: 0.35rem; margin-bottom: 0.375rem; min-height: 3.15rem; font-family: system-ui; background-color: #00000030; cursor: pointer;">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <p style="font-size: 0.875rem; font-family: system-ui; margin-top: 0.125rem; margin-left: 1.75px; color: #d1d1d1a6;">
                  Want to revoke access to this link? <span class="regenerate-link" style="color: var(--discord-primary); transition: color 0.2s ease; cursor: pointer;">Generate a new link</span>
                </p>
              </div>
            </div>
          </div>
          <div id="analyticsSection" class="workbench-section settings-section" style="
            padding: 1.5rem 2rem;
            padding-bottom: 4.75rem;
            margin-top: 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            transition: all 0.3s ease;
            border: 1px solid transparent;
            box-shadow: none;
            height: 44.25vh;
            overflow-x: auto;
            overflow-y: hidden;
          ">
            <h3 style="flex-direction: row; margin-bottom: 1rem;">
              <i class="fas fa-chart-simple"></i>Analytics
            </h3>
            <div style="display: flex; flex-direction: row; height: calc(44.25vh - 7rem);">
              <canvas id="analyticsChart"></canvas>
              <canvas id="commandsChart" style="margin-top: -2.25rem; margin-left: 3.5rem; opacity: 0.8;"></canvas>
              <canvas id="eventsChart" style="margin-top: -2.25rem; margin-left: 1.75rem; opacity: 0.8;"></canvas>
            </div>
          </div>
          <div id="landingPageSection" class="workbench-section settings-section" style="
            padding: 1.5rem 2rem 2rem;
            margin-top: 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            transition: all 0.3s ease;
            border: 1px solid transparent;
            box-shadow: none;
          ">
            <h3 style="flex-direction: row; margin-bottom: 1rem;">
              <i class="fas fa-laptop-code"></i>Landing Page
              <button class="add-command-btn" style="right: 117.5px;">
                <i class="fas fa-plus"></i>
                Add Feature
              </button>
              <button class="add-command-btn" style="right: 74.7px; padding: 0.55rem 0.65rem;">
                <i class="fas fa-upload"></i>
              </button>
              <button class="add-command-btn" style="right: 32.5px; padding: 0.55rem 0.65rem;">
                <i class="fas fa-arrow-up-right-from-square"></i>
              </button>
            </h3>
            <div class="grid-container" style="margin-top: 20px;">
              ${
                (bot.features || []).map((feature) => `
                  <div class="card" data-id="${this.escapeHtml(feature.id.toString())}">
                    <i class="fas fa-xmark" style="
                      float: right;
                      cursor: pointer;
                      opacity: 0.85;
                    "></i>
                    <div class="icon">
                      <i class="fas fa-${this.escapeHtml(feature.icon)}"></i>
                    </div>
                    <p class="title" contenteditable spellcheck="false" placeholder="Enter title...">${this.escapeHtml(feature.name)}</p>
                    <p class="description" contenteditable spellcheck="false" placeholder="Enter description...">${this.escapeHtml(feature.description)}</p>
                  </div>
                `).join("\n")
              }
              <div class="card">
                <div class="icon">
                  <i class="fas fa-robot"></i>
                </div>
                <p class="title">Powered by LocalBotify.app</p>
                <p class="description">Built using LocalBotify for speed, flexibility, and total control — no code needed.</p>
              </div>
            </div>
          </div>
          <div id="vanityLinksSection" class="workbench-section settings-section" style="
            padding: 1.5rem 2rem;
            margin-top: 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            transition: all 0.3s ease;
            border: 1px solid transparent;
            box-shadow: none;
          ">
            <h3 style="flex-direction: row; margin-bottom: 1rem;">
              <i class="fas fa-link"></i>Vanity Links
              <button class="add-command-btn" style="right: 25px;">
                <i class="fas fa-plus"></i>
                Create Vanity Link
              </button>
            </h3>
            ${(!bot?.vanityLinks?.length) ? `<span style="color: grey;">No vanity links found</span>` : bot?.vanityLinks?.map((shortenedUrl) => `
              <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;">${this.escapeHtml(shortenedUrl)}</div>
            `).join("")}
          </div>
        </div>

        <div id="suiteDetailView" style="display: none;"></div>
      </div>
    `;

    const workbenchView = workspaceView.querySelector(".workbench-view");
    const workbenchMainView = workbenchView.querySelector("#workbenchMainView");
    const workbenchEditorView = workbenchView.querySelector("#workbenchEditorView");
    const editorView = workspaceView.querySelector(".code-editor-view");
    const suiteView = workspaceView.querySelector(".suite-view");
    const suiteMainView = workspaceView.querySelector("#suiteMainView");
    const suiteDetailView = workspaceView.querySelector("#suiteDetailView");

    requestAnimationFrame(() => {
      if (workbenchView.scrollHeight <= (workbenchView.clientHeight + 15)) (workbenchView.style.overflowY = "hidden");
      setTimeout(() => {
        workbenchView.style.removeProperty("overflow-y");
      }, 500);
    });

    workspaceView.querySelectorAll(".workspace-tabs button").forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.classList.contains("active")) return;

        workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
        tab.classList.add("active");

        if (tab.querySelector("i").className === "fas fa-tools") {
          workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("currentView"));
          tab.classList.add("currentView");

          editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.add("animationless"));
          editorView.querySelector(".editor-terminal .xterm-viewport").style.display = "none";
          editorView.style.visibility = "hidden";
          suiteView.style.display = "none";
          workbenchView.scrollTop = 0;
          requestAnimationFrame(() => {
            if (workbenchView.scrollHeight <= (workbenchView.clientHeight + 15)) (workbenchView.style.overflowY = "hidden");
          });
          workbenchView.style.display = "block";
          workbenchEditorView.style.display = "none";
          workbenchMainView.style.display = "block";
          setTimeout(() => {
            workbenchView.style.removeProperty("overflow-y");
          }, 500);
        } else if (tab.querySelector("i").className === "fas fa-code") {
          workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("currentView"));
          tab.classList.add("currentView");

          workbenchView.style.display = "none";
          suiteView.style.display = "none";
          editorView.style.visibility = "visible";
          editorView.style.animation = "slideUp 0.5s ease";
          setTimeout(() => {
            editorView.style.animation = "none";
          }, 500);
          editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.remove("animationless"));
          editorView.querySelector(".editor-terminal .xterm-viewport").style.display = "block";
        } else if (tab.querySelector("i").className === "fas fa-trophy") {
          if (!this.isProPlan) return this.showUpgradeModal();

          workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("currentView"));
          tab.classList.add("currentView");

          editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.add("animationless"));
          editorView.querySelector(".editor-terminal .xterm-viewport").style.display = "none";
          editorView.style.visibility = "hidden";
          workbenchView.style.display = "none";
          suiteView.style.display = "block";
          suiteDetailView.style.display = "none";
          suiteMainView.style.display = "block";
          suiteMainView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
          setTimeout(() => {
            suiteMainView.style.animation = "none";
          }, 500);
        };
      });
    });

    window.addEventListener("resize", () => {
      workbenchEditorView.style.setProperty("--workbench-editor-view-scrollbar", (workbenchView.scrollHeight > workbenchView.clientHeight) ? "8px" : "0px");
    });

    workbenchMainView.querySelector("#workbench-invite-btn").addEventListener("click", () => {
      if (!fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/invite.txt"), "utf8")) return this.alert("⚠️ Missing Invite Link", "Please run the bot to generate an invite link.");

      const childProcess = require("child_process");

      childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/invite.txt"), "utf8") + `"`, (process.platform === "win32") ? {
        shell: "powershell.exe"
      } : {});
    });

    workbenchMainView.querySelector("#workbench-publish-btn").addEventListener("click", () => {
      this.showPublicationModal(bot);
    });

    workbenchMainView.querySelector("#workbench-settings-btn").addEventListener("click", () => {
      this.showBotSettings(bot);
    });

    workbenchMainView.querySelector("#botPrefix").addEventListener("input", (e) => {
      e.target.style.width = (2.75 + ((e.target.value.length - 1) * 0.5)).toString() + "rem";
    });

    workbenchMainView.querySelectorAll("#botPrefix, #slashCommands, #botStatusSymbol, #botStatusActivity, #botStatusMessage, #botFooter").forEach((botConfigItem) => {
      botConfigItem.addEventListener("change", (e) => {
        switch (e.target.id) {
          case "botPrefix":
            configFile.prefix = e.target.value;
            break;
          case "slashCommands":
            configFile.slashCommands = e.target.checked;
            break;
          case "botStatusSymbol":
            configFile.status[0] = e.target.value;
            break;
            case "botStatusActivity":
            configFile.status[1] = e.target.value;
            break;
          case "botStatusMessage":
            configFile.status[2] = e.target.value;
            break;
          case "botFooter":
            configFile.footer = e.target.value;
            break;
        };

        fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
      });
    });

    workbenchMainView.querySelectorAll(".add-command-btn").forEach((button, index) => {
      button.addEventListener("click", () => {
        this.addInteractionItem(workspaceView, bot, (!index) ? "commands" : "events");
      });
    });

    workbenchMainView.querySelectorAll(".workbench-section .setting-item").forEach((command) => {
      command.addEventListener("click", () => {
        workbenchView.scrollTop = 0;

        delete require.cache[require.resolve(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, command.textContent.trim() + ".js"))];
        const variables = Object.entries(require(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, command.textContent.trim() + ".js")).variables);

        workbenchEditorView.innerHTML = `
          <h3 class="command-header">
            <i class="fas fa-${(command.dataset.category === "commands") ? "code" : "calendar-days"}"></i><span contenteditable spellcheck="false">${this.escapeHtml((command.dataset.category === "commands") ? command.textContent.trim() : command.textContent.trim().replace(/[^A-Za-z]/g, ""))}</span>
            <button class="add-command-btn" style="position: absolute; right: 39.5px;">
              <i class="fas fa-code"></i>
              Edit in code lab
            </button>
            <button class="add-command-btn" style="position: absolute; right: 0; padding: 0.55rem 0.65rem;">
              <i class="fas fa-trash"></i>
            </button>
          </h3>
          ${(!variables.length) ? `
              <div class="command-item setting-item">
                <label style="color: grey; cursor: text;">
                  No variables found
                </label>
              </div>
            ` : variables.map(([id, { title = "", description = "", default: defaultValue = "", type = "text", datalist = null, options = {}, properties = {} } = {}] = [], index) => `
            <div class="command-item setting-item" style="margin-bottom: 1rem;" data-id="${this.escapeHtml(id)}">
              ${(type === "switch") ? `
                <label>
                  <span>${this.escapeHtml(title)}</span>
                  <input type="checkbox"${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue) ? " checked" : ""} ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}/>
                </label>
                ${
                  (description) ? `
                    <div class="setting-description">
                      ${this.escapeHtml(description)}
                    </div>
                  ` : ""
                }
              ` : `
                <label style="flex-direction: column;">
                  <span style="text-align: left; position: absolute; left: 0;">${this.escapeHtml(title)}</span>
                  ${
                    (description) ? `
                      <div class="setting-description" style="margin-top: 1.675rem; position: absolute; left: 0;">
                        ${this.escapeHtml(description)}
                      </div>
                    ` : ""
                  }
                  ${(type === "textarea") ? `
                    <textarea style="height: 3.15rem; margin-top: 60px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #00000030; resize: vertical;" placeholder="Enter ${title.toLowerCase()}..." ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>${JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue ?? ""}</textarea>
                  ` : ((type === "select") ? `
                    <select style="margin-top: 60px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #151618;" placeholder="Enter ${title.toLowerCase()}..." ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>
                      ${Object.entries(options).map(([optionId, optionName]) => `
                        <option value="${optionId}">${optionName}</option>
                      `)}
                    </select>
                  ` : `
                    <input type="${type.replace("slider", "range").replace("telephone", "tel").replace("link", "url") || "text"}" ${(type !== "color") ? `style="margin-top: ${(60 - ((type === "slider") * 17.5) - (!description * 31.5)).toString()}px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #00000030;"` : `style="margin-top: ${(55 - (!description * 31.5)).toString()}px;"`}placeholder="Enter ${title.toLowerCase()}..." value="${JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue ?? ""}" ${(datalist) ? `list=workbench-datalist-${index} ` : "" }${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>
                  `)}
                </label>
              `}
              ${(datalist) ? `
                <datalist id="workbench-datalist-${index}">
                  ${datalist.map((value) => `
                    <option value="${value}"></option>
                  `)}
                </datalist>
              ` : ""}
            </div>
          `).join("")}
        `;

        requestAnimationFrame(() => {
          workbenchEditorView.style.setProperty("--workbench-editor-view-scrollbar", (workbenchView.scrollHeight > workbenchView.clientHeight) ? "8px" : "0px");

          workbenchEditorView.querySelectorAll(".command-item.setting-item textarea").forEach((commandItemInput) => {
            commandItemInput.style.height = `${(commandItemInput.scrollHeight + 4.4).toString()}px`;
          });
        });

        workbenchEditorView.querySelector(".command-header span").addEventListener("blur", () => {
          if (workbenchEditorView.querySelector(".command-header span").textContent.trim() === command.textContent.trim()) return;

          fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`), path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${workbenchEditorView.querySelector(".command-header span").textContent.trim()}.js`));

          if (!configFile) (configFile = {});
          if (!configFile.variables) (configFile.variables = {});
          if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
          if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});

          if (configFile.variables[command.dataset.category][command.textContent.trim()]) {
            configFile.variables[command.dataset.category][workbenchEditorView.querySelector(".command-header span").textContent.trim()] = configFile.variables[command.dataset.category][command.textContent.trim()];
            delete configFile.variables[command.dataset.category][command.textContent.trim()];

            fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
          };

          if (command.dataset.category === "commands") {
            command.textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim();
          } else {
            command.innerHTML = (this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().replace(/[^a-zA-Z]+$/, "")) + ((workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/))}</code>` : ""));
          };

          workbenchEditorView.querySelector(".command-header span").textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim().trim().replace(/[^A-Za-z]/g, "");
        });

        workbenchEditorView.querySelector(".command-header span").addEventListener("keydown", (e) => {
          if ((e.key !== "Enter") || (workbenchEditorView.querySelector(".command-header span").textContent.trim() === command.textContent.trim())) return;

          e.preventDefault();

          workbenchEditorView.querySelector(".command-header span").blur();

          fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`), path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${workbenchEditorView.querySelector(".command-header span").textContent.trim()}.js`));

          if (!configFile) (configFile = {});
          if (!configFile.variables) (configFile.variables = {});
          if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
          if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});

          if (configFile.variables[command.dataset.category][command.textContent.trim()]) {
            configFile.variables[command.dataset.category][workbenchEditorView.querySelector(".command-header span").textContent.trim()] = configFile.variables[command.dataset.category][command.textContent.trim()];
            delete configFile.variables[command.dataset.category][command.textContent.trim()];

            fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
          };

          if (command.dataset.category === "commands") {
            command.textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim();
          } else {
            command.innerHTML = (this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().replace(/[^a-zA-Z]+$/, "")) + ((workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/))}</code>` : ""));
          };

          workbenchEditorView.querySelector(".command-header span").textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim().trim().replace(/[^A-Za-z]/g, "");
        });

        workbenchEditorView.querySelectorAll(".command-header button").forEach((button) => {
          button.addEventListener("click", () => {
            if (button.querySelector("i").className === "fas fa-code") {
              this.getFileTreeItem(editorView, command.dataset.category).click();
              this.getFileTreeItem(editorView, `${command.dataset.category}/${command.textContent.trim()}.js`).click();

              Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-code").classList.add("active");
              workbenchView.style.display = "none";
              editorView.style.visibility = "visible";
              editorView.style.animation = "slideUp 0.5s ease";
              setTimeout(() => {
                editorView.style.animation = "none";
              }, 500);
              editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.remove("animationless"));
            } else if (button.querySelector("i").className === "fas fa-trash") {
              try {
                this.confirm(`Delete ${command.dataset.category[0].toUpperCase() + command.dataset.category.substring(1, command.dataset.category.length - 1)}`, `Are you sure you want to delete ${command.textContent.trim()}?`, "dangerous").then(() => {
                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`));

                  if (workbenchMainView.querySelector(`.workbench-section .setting-item[data-category="${command.dataset.category}"]`).length === 1) {
                    const noItems = document.createElement("span");
                    noItems.style.color = "grey";
                    noItems.textContent = `No ${command.dataset.category} found`;
                    workbenchMainView.querySelector(`.workbench-section h3 i.fa-${command.dataset.category.replace("commands", "code").replace("events", "calendar-days")}`).parentElement.insertBefore(noItems, workbenchMainView.querySelector(`.workbench-section h3 i.fa-${command.dataset.category.replace("commands", "code").replace("events", "calendar-days")}`).parentElement.nextElementSibling);
                  };

                  workbenchEditorView.style.display = "none";
                  workbenchMainView.style.display = "block";
                  workbenchMainView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
                  setTimeout(() => workbenchMainView.style.removeProperty("animation"), 500);
                  Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-tools").classList.add("active");

                  command.remove();
                }).catch(() => {});
              } catch {};
            };
          });
        });

        workbenchEditorView.querySelectorAll(".command-item.setting-item").forEach((commandItem) => {
          if (!commandItem.dataset.id) return;

          commandItem.querySelector("input, textarea, select").addEventListener("change", (e) => {
            if (!e.target.reportValidity()) return;

            if (e.target.type !== "file") {
              if (!configFile) (configFile = {});
              if (!configFile.variables) (configFile.variables = {});
              if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
              if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});
              configFile.variables[command.dataset.category][command.textContent.trim()][commandItem.dataset.id] = ((e.target.tagName === "INPUT") && (e.target.type === "checkbox")) ? e.target.checked : ((["number", "range"].includes(e.target.type)) ? parseInt(e.target.value) : e.target.value);

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            } else {
              if (!fs.existsSync(path.join(process.cwd(), "bots", bot.id.toString(), "assets"))) fs.mkdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "assets"));

            };
          });
        });

        workbenchMainView.style.display = "none";
        workbenchEditorView.style.display = "block";
        workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
      });
    });

    if (fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString())).find((file) => !fs.statSync(path.join(process.cwd(), "bots", bot.id.toString(), file)).isDirectory())) {
      const activeFile = ((dir) => {
        const files = fs.readdirSync(dir);
        if (files.includes("index.js")) return "index.js";
        if (files.includes("package.json")) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
            if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
            return "package.json";
          } catch {
            return "package.json";
          };
        };
        const firstJsFile = files.find((file) => file.endsWith(".js"));
        if (firstJsFile) return firstJsFile;
        const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
        if (firstNonFolder) return firstNonFolder;
        const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
        if (firstFile) return firstFile.substring(2);
        return null;
      })(path.join(process.cwd(), "bots", bot.id.toString()));

      this.getFileTreeItem(editorView, activeFile).classList.add("active", "active-file");
      this.fileWatcher = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), activeFile), (eventType) => {
        if ((eventType !== "change") || (this.editor.getValue() === fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), activeFile), "utf8"))) return;

        this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), activeFile), "utf8"));

        editorView.querySelector(".editor-play-btn").style.right = (this.editor.getScrollerElement().scrollHeight > this.editor.getScrollerElement().clientHeight) ? "calc(0.5rem + 5px)" : "calc(0.5rem - 2.5px)";
      });
    };

    this.loadCodeEditor(editorView, bot);
    this.createTerminal(bot);

    document.body.appendChild(workspaceView);
    setTimeout(() => workspaceView.classList.add("show"), 10);

    const closeBtn = workspaceView.querySelector(".workspace-close-btn");
    closeBtn.addEventListener("click", () => {
      workspaceView.classList.remove("show");
      setTimeout(() => workspaceView.remove(), 300);
    });

    fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), "channels/process.txt"), (eventType) => {
      if (eventType !== "change") return;

      workbenchView.querySelector("#workbench-play-btn").children[0].className = (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/process.txt")).trim() === "ONLINE") ? "fas fa-stop" : "fas fa-play";
      workbenchView.querySelector("#workbench-play-btn").childNodes[2].textContent = (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/process.txt")).trim() === "ONLINE") ? "Stop" : "Run";

      editorView.querySelector(".editor-play-btn").children[0].className = (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/process.txt")).trim() === "ONLINE") ? "fas fa-stop" : "fas fa-play";
    });

    workspaceView.querySelectorAll("#workbench-play-btn, .editor-play-btn").forEach((playBtn) => {
      playBtn.addEventListener("click", () => {
        ipcRenderer.send("terminalData", [
          bot.id,
          (playBtn.children[0].className === "fas fa-stop") ? "\x03" : (((bot.initialized || !JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.commands?.initialization) ? "" : ((JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.commands?.initialization || "") + "; ")) + `${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.commands?.startup || "")}\r\n`)
        ]);

        if (playBtn.children[0].className === "fas fa-stop") {
          setTimeout(() => {
            ipcRenderer.send("terminalData", [
              bot.id,
              "\x03"
            ]);
          }, 500);
        };

        workspaceView.querySelectorAll("#workbench-play-btn, .editor-play-btn").forEach((changedPlayBtn) => {
          changedPlayBtn.children[0].className = (changedPlayBtn.children[0].className === "fas fa-stop") ? "fas fa-play" : "fas fa-stop";
          if (changedPlayBtn.id === "workbench-play-btn") changedPlayBtn.childNodes[2].textContent = (changedPlayBtn.children[0].className === "fas fa-play") ? "Run" : "Stop";
        });
      });
    });

    this.watchDirectoryRecursive(path.join(process.cwd(), "bots", bot.id.toString()), (eventType) => {
      if (eventType !== "rename") return;

      if ((this.collaborationSessions || {})[bot.id.toString()]) {
        (this.collaborationSockets || {})[bot.id.toString()].emit("newFileSystem", this.getFlatFileList(bot, path.join(process.cwd(), "bots", bot.id.toString())));
      };

      if (JSON.stringify(this.getFlatFileList(bot, path.join(process.cwd(), "bots", bot.id.toString()))) === this.parseFileTree(editorView.querySelector(".file-tree"))) return;

      const activeItem = this.getFilePath(editorView.querySelector(".file-tree-item.active")) || "";
      const activeFile = this.getFilePath(editorView.querySelector(".file-tree-item.active-file")) || "";
      const newFile = this.getFlatFileList(bot, path.join(process.cwd(), "bots", bot.id.toString())).filter((file) => !this.parseFileTree(editorView.querySelector(".file-tree")).includes(file))[0]?.slice(2) || "";

      editorView.querySelector(".file-tree").innerHTML = this.renderFileTree(this.generateFileTree(path.join(process.cwd(), "bots", bot.id.toString())));

      (this.getFileTreeItem(editorView, activeItem) || this.getFileTreeItem(editorView, activeFile) || this.getFileTreeItem(editorView, newFile) || this.getFileTreeItem(editorView, ((dir) => {
        const files = fs.readdirSync(dir);
        if (files.includes("index.js")) return "index.js";
        if (files.includes("package.json")) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
            if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
            return "package.json";
          } catch {
            return "package.json";
          };
        };
        const firstJsFile = files.find((file) => file.endsWith(".js"));
        if (firstJsFile) return firstJsFile;
        const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
        if (firstNonFolder) return firstNonFolder;
        const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
        if (firstFile) return firstFile.substring(2);
        return null;
      })(path.join(process.cwd(), "bots", bot.id.toString())))).classList.add(...[
        ...[
          "active"
        ],
        ...(activeItem !== activeFile) ? [] : [
          "active-file"
        ]
      ]);

      this.setupFileTreeListeners(editorView, bot);
    });

    const addFileBtn = editorView.querySelector(`.file-explorer-btn[title="New File"]`);
    [
      ...[
        addFileBtn
      ],
      ...(editorView.querySelector(".editor-content-missing")) ? [
        editorView.querySelectorAll(".editor-content-missing button")[1]
      ] : []
    ].forEach((button) => {
      button.addEventListener("click", () => {
        let newFileTreeItem = document.createElement("div");
        newFileTreeItem.className = "file-tree-item";
        newFileTreeItem.style.cursor = "text";
        newFileTreeItem.innerHTML = `
          <i class="fas fa-file"></i>
          <span contenteditable="true"></span>
        `;

        newFileTreeItem.querySelector("span").addEventListener("blur", () => {
          if (!newFileTreeItem.querySelector("span").textContent.trim()) return newFileTreeItem.remove();
          if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

          newFileTreeItem.style.removeProperty("cursor");
          newFileTreeItem.querySelector("i").className = `fas ${(newFileTreeItem.querySelector("span").textContent.endsWith(".json")) ? "fa-file" : "fa-file-code"}`;
          newFileTreeItem.querySelector("span").contentEditable = false;
          newFileTreeItem.dataset.filename = newFileTreeItem.querySelector("span").textContent;

          const path = require("path");
          fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "", "utf8");

          newFileTreeItem.addEventListener("click", () => {
            const fileItems = editorView.querySelectorAll(".file-tree-item");

            fileItems.forEach((i) => i.classList.remove("active", "active-file"));
            newFileTreeItem.classList.add("active", "active-file");

            this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"));
            this.editor.clearHistory();
            this.fileWatcher.close();
            this.fileWatcher = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), (eventType) => {
              if ((eventType !== "change") || (this.editor.getValue() === fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"))) return;

              this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"));

              editorView.querySelector(".editor-play-btn").style.right = (this.editor.getScrollerElement().scrollHeight > this.editor.getScrollerElement().clientHeight) ? "calc(0.5rem + 5px)" : "calc(0.5rem - 2.5px)";
            });
          });

          newFileTreeItem.addEventListener("contextmenu", (e) => {
            if (document.body.querySelector(".file-tree-context-menu")) document.body.querySelector(".file-tree-context-menu").remove();

            const contextMenu = document.createElement("div");
            contextMenu.className = "file-tree-context-menu";

            contextMenu.innerHTML = `
              <div class="context-menu-rename-btn">
                <i class="fas fa-pen" style="margin-right: 8.75px;"></i>Rename
              </div>
              <div class="context-menu-delete-btn">
                <i class="fas fa-trash" style="margin-right: 10.5px;"></i>Delete
              </div>
            `;

            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;

            contextMenu.querySelector(".context-menu-rename-btn").addEventListener("click", () => {
              const oldFilePath = this.getFilePath(item);

              const span = newFileTreeItem.querySelector("span");
              span.style.cursor = "text";
              span.contentEditable = true;
              span.focus();
              span.addEventListener("blur", () => {
                if (!span.textContent.trim()) return newFileTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFileTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)));

                newFileTreeItem.click();
              });

              span.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;

                if (!span.textContent.trim()) return newFileTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFileTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)));

                newFileTreeItem.click();
              });
            });

            contextMenu.querySelector(".context-menu-delete-btn").addEventListener("click", () => {
              this.confirm("Delete File", `Are you sure you want to delete ${this.escapeHtml(newFileTreeItem.dataset.filename || newFileTreeItem.querySelector("span").textContent.trim())}?`, "dangerous").then(() => {
                item.remove();

                try {
                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8");
                } catch {};
              }).catch(() => {});
            });

            document.body.appendChild(contextMenu);

            window.addEventListener("click", () => {
              contextMenu.remove();
            });
          });

          newFileTreeItem.click();
        });

        newFileTreeItem.querySelector("span").addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          if (!newFileTreeItem.querySelector("span").textContent.trim()) return newFileTreeItem.remove();
          if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

          newFileTreeItem.style.removeProperty("cursor");
          newFileTreeItem.querySelector("i").className = `fas ${(newFileTreeItem.querySelector("span").textContent.endsWith(".json")) ? "fa-file" : "fa-file-code"}`;
          newFileTreeItem.querySelector("span").contentEditable = false;

          const path = require("path");
          fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "", "utf8");

          newFileTreeItem.addEventListener("click", () => {
            const fileItems = editorView.querySelectorAll(".file-tree-item");

            fileItems.forEach((i) => i.classList.remove("active", "active-file"));
            newFileTreeItem.classList.add("active", "active-file");

            this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"));
            this.editor.clearHistory();
            this.fileWatcher.close();
            this.fileWatcher = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), (eventType) => {
              if ((eventType !== "change") || (this.editor.getValue() === fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"))) return;

              this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"));
            });
          });

          newFileTreeItem.addEventListener("contextmenu", (e) => {
            if (document.body.querySelector(".file-tree-context-menu")) document.body.querySelector(".file-tree-context-menu").remove();

            const contextMenu = document.createElement("div");
            contextMenu.className = "file-tree-context-menu";

            contextMenu.innerHTML = `
              <div class="context-menu-rename-btn">
                <i class="fas fa-pen" style="margin-right: 8.75px;"></i>Rename
              </div>
              <div class="context-menu-delete-btn">
                <i class="fas fa-trash" style="margin-right: 10.5px;"></i>Delete
              </div>
            `;

            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;

            contextMenu.querySelector(".context-menu-rename-btn").addEventListener("click", () => {
              const oldFilePath = this.getFilePath(item);

              const span = newFileTreeItem.querySelector("span");
              span.style.cursor = "text";
              span.contentEditable = true;
              span.focus();
              span.addEventListener("blur", () => {
                if (!span.textContent.trim()) return newFileTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFileTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)));

                newFileTreeItem.click();
              });

              span.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;

                if (!span.textContent.trim()) return newFileTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFileTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)));

                newFileTreeItem.click();
              });
            });

            contextMenu.querySelector(".context-menu-delete-btn").addEventListener("click", () => {
              this.confirm("Delete File", `Are you sure you want to delete ${this.escapeHtml(newFileTreeItem.dataset.filename || newFileTreeItem.querySelector("span").textContent.trim())}?`, "dangerous").then(() => {
                item.remove();

                try {
                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8");
                } catch {};
              }).catch(() => {});
            });

            document.body.appendChild(contextMenu);

            window.addEventListener("click", () => {
              contextMenu.remove();
            });
          });

          newFileTreeItem.click();
        });

        ((document.querySelector(".file-tree-item.active.active-file")) ? document.querySelector(".file-tree-item.active.active-file").parentElement : ((document.querySelector(".file-tree-item.active")) ? document.querySelector(".file-tree-item.active").nextElementSibling : document.querySelector(".file-tree"))).appendChild(newFileTreeItem);
        newFileTreeItem.querySelector("span").focus();
      });
    });

    const addFolderBtn = editorView.querySelector(`.file-explorer-btn[title="New Folder"]`);
    [
      ...[
        addFolderBtn
      ],
      ...(editorView.querySelector(".editor-content-missing")) ? [
        editorView.querySelectorAll(".editor-content-missing button")[0]
      ] : []
    ].forEach((button) => {
      button.addEventListener("click", () => {
        let newFolderTreeItem = document.createElement("div");
        newFolderTreeItem.className = "file-tree-item folder";
        newFolderTreeItem.style.cursor = "text";
        newFolderTreeItem.innerHTML = `
          <i class="fas fa-folder"></i>
          <span contenteditable="true"></span>
        `;

        let newFolderTreeContent = document.createElement("div");
        newFolderTreeContent.className = "folder-content";
        newFolderTreeContent.style.display = "none";
        newFolderTreeContent.style.paddingLeft = "1rem";

        newFolderTreeItem.querySelector("span").addEventListener("blur", () => {
          if (!newFolderTreeItem.querySelector("span").textContent.trim()) return newFolderTreeItem.remove();
          if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

          newFolderTreeItem.style.removeProperty("cursor");
          newFolderTreeItem.querySelector("span").contentEditable = false;

          const path = require("path");
          fs.mkdirSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)));

          newFolderTreeItem.addEventListener("click", () => {
            const fileItems = editorView.querySelectorAll(".file-tree-item");

            fileItems.forEach((i) => i.classList.remove("active"));
            newFolderTreeItem.classList.add("active");

            newFolderTreeItem.nextElementSibling.style.display = (newFolderTreeItem.nextElementSibling.style.display === "none") ? "block" : "none";
          });

          newFolderTreeItem.addEventListener("contextmenu", (e) => {
            if (document.body.querySelector(".file-tree-context-menu")) document.body.querySelector(".file-tree-context-menu").remove();

            const contextMenu = document.createElement("div");
            contextMenu.className = "file-tree-context-menu";

            contextMenu.innerHTML = `
              <div class="context-menu-rename-btn">
                <i class="fas fa-pen" style="margin-right: 8.75px;"></i>Rename
              </div>
              <div class="context-menu-delete-btn">
                <i class="fas fa-trash" style="margin-right: 10.5px;"></i>Delete
              </div>
            `;

            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;

            contextMenu.querySelector(".context-menu-rename-btn").addEventListener("click", () => {
              const oldFilePath = this.getFilePath(item);

              const span = newFolderTreeItem.querySelector("span");
              span.style.cursor = "text";
              span.contentEditable = true;
              span.focus();
              span.addEventListener("blur", () => {
                if (!span.textContent.trim()) return newFolderTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFolderTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)));

                newFolderTreeItem.click();
              });

              span.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;

                if (!span.textContent.trim()) return newFolderTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFolderTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)));

                newFolderTreeItem.click();
              });
            });

            contextMenu.querySelector(".context-menu-delete-btn").addEventListener("click", () => {
              this.confirm("Delete File", `Are you sure you want to delete ${this.escapeHtml(newFolderTreeItem.dataset.filename || newFolderTreeItem.querySelector("span").textContent.trim())}?`, "dangerous").then(() => {
                item.remove();

                try {
                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)), "utf8");
                } catch {};
              }).catch(() => {});
            });

            document.body.appendChild(contextMenu);

            window.addEventListener("click", () => {
              contextMenu.remove();
            });
          });

          newFolderTreeItem.click();
        });

        newFolderTreeItem.querySelector("span").addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          if (!newFolderTreeItem.querySelector("span").textContent.trim()) return newFolderTreeItem.remove();
          if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

          newFolderTreeItem.style.removeProperty("cursor");
          newFolderTreeItem.querySelector("span").contentEditable = false;

          const path = require("path");
          fs.mkdirSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)));

          newFolderTreeItem.addEventListener("click", () => {
            const fileItems = editorView.querySelectorAll(".file-tree-item");

            fileItems.forEach((i) => i.classList.remove("active"));
            newFolderTreeItem.classList.add("active");

            newFolderTreeItem.nextElementSibling.style.display = (newFolderTreeItem.nextElementSibling.style.display === "none") ? "block" : "none";
          });

          newFolderTreeItem.addEventListener("contextmenu", (e) => {
            if (document.body.querySelector(".file-tree-context-menu")) document.body.querySelector(".file-tree-context-menu").remove();

            const contextMenu = document.createElement("div");
            contextMenu.className = "file-tree-context-menu";

            contextMenu.innerHTML = `
              <div class="context-menu-rename-btn">
                <i class="fas fa-pen" style="margin-right: 8.75px;"></i>Rename
              </div>
              <div class="context-menu-delete-btn">
                <i class="fas fa-trash" style="margin-right: 10.5px;"></i>Delete
              </div>
            `;

            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;

            contextMenu.querySelector(".context-menu-rename-btn").addEventListener("click", () => {
              const oldFilePath = this.getFilePath(item);

              const span = newFolderTreeItem.querySelector("span");
              span.style.cursor = "text";
              span.contentEditable = true;
              span.focus();
              span.addEventListener("blur", () => {
                if (!span.textContent.trim()) return newFolderTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFolderTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)));

                newFolderTreeItem.click();
              });

              span.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;

                if (!span.textContent.trim()) return newFolderTreeItem.remove();
                if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

                span.style.cursor = "pointer";
                span.contentEditable = false;
                newFolderTreeItem.dataset.filename = span.textContent.trim();
                fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)));

                newFolderTreeItem.click();
              });
            });

            contextMenu.querySelector(".context-menu-delete-btn").addEventListener("click", () => {
              this.confirm("Delete File", `Are you sure you want to delete ${this.escapeHtml(newFolderTreeItem.dataset.filename || newFolderTreeItem.querySelector("span").textContent.trim())}?`, "dangerous").then(() => {
                item.remove();

                try {
                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFolderTreeItem)), "utf8");
                } catch {};
              }).catch(() => {});
            });

            document.body.appendChild(contextMenu);

            window.addEventListener("click", () => {
              contextMenu.remove();
            });
          });

          newFolderTreeItem.click();
        });

        ((document.querySelector(".file-tree-item.active.active-file")) ? document.querySelector(".file-tree-item.active.active-file").parentElement : ((document.querySelector(".file-tree-item.active")) ? document.querySelector(".file-tree-item.active").nextElementSibling : document.querySelector(".file-tree"))).appendChild(newFolderTreeItem);
        ((document.querySelector(".file-tree-item.active.active-file")) ? document.querySelector(".file-tree-item.active.active-file").parentElement : ((document.querySelector(".file-tree-item.active")) ? document.querySelector(".file-tree-item.active").nextElementSibling : document.querySelector(".file-tree"))).appendChild(newFolderTreeContent);
        newFolderTreeItem.querySelector("span").focus();
      });
    });

    this.setupFileTreeListeners(editorView, bot);

    const analytics = (fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/analytics.txt"), "utf8") || "").split("\n").slice(1);

    const labels = [];
    const serverData = [];
    const userData = [];

    for (let i = 0; i < analytics.length; i += 3) {
      const timestamp = parseInt(analytics[i], 10);
      const date = new Date(timestamp);
      labels.push(date.toLocaleDateString());

      serverData.push(parseInt(analytics[i + 1], 10));
      userData.push(parseInt(analytics[i + 2], 10));
    };

    await new Promise((resolve, reject) => {
      if (document.querySelector(".chart-script")) resolve();

      const chartScript = document.createElement("script");
      chartScript.src = "../packages/chart.js/chart.js";
      chartScript.className = "chart-script";

      chartScript.addEventListener("load", resolve);

      document.head.appendChild(chartScript);
    });

    suiteMainView.querySelector("#assistantSection form select").addEventListener("change", (e) => {
      suiteMainView.querySelector("#assistantSection form input").placeholder = `Enter ${e.target.value.toLowerCase()} name...`;
    });

    suiteMainView.querySelector("#assistantSection form").addEventListener("submit", (e) => {
      e.preventDefault();

      if (!navigator.onLine) return this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");

      const category = `${suiteMainView.querySelector("#assistantSection form select").value.toLowerCase()}s`;
      const fileName = `${suiteMainView.querySelector("#assistantSection form input").value}.js`;
      const prompt = suiteMainView.querySelector("#assistantSection form textarea").value;

      suiteMainView.querySelector("#assistantSection form select").value = "Command";
      suiteMainView.querySelector("#assistantSection form input").value = "";
      suiteMainView.querySelector("#assistantSection form textarea").value = "";

      const fileWatcher = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), category), (eventType) => {
        if (eventType !== "rename") return;

        this.getFileTreeItem(editorView, category).click();
        this.getFileTreeItem(editorView, `${category}/${fileName}`).click();

        fileWatcher.close();
      });

      if (fs.existsSync(path.join(process.cwd(), "bots", bot.id.toString(), category, fileName))) {
        this.getFileTreeItem(editorView, category).click();
        this.getFileTreeItem(editorView, `${category}/${fileName}`).click();
      };

      fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), category, fileName), "", "utf8");

      workbenchMainView.querySelector(".workbench-section").innerHTML = `
        <h3 style="flex-direction: row; margin-bottom: 1rem;">
          <i class="fas fa-code"></i>Commands
          <button class="add-command-btn" style="right: 25px;">
            <i class="fas fa-plus"></i>
            Add Command
          </button>
        </h3>
        ${(!fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "commands")).length) ? `<span style="color: grey;">No commands found</span>` : fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "commands")).map((command) => (command.endsWith(".js")) ? `
          <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;" data-category="commands">${this.escapeHtml(command.substring(0, command.length - 3))}</div>
        ` : "").join("")}
        <h3 style="flex-direction: row; margin-bottom: 1rem; margin-top: 2rem;">
          <i class="fas fa-calendar-days"></i>Events
          <button class="add-command-btn" style="right: 25px;">
            <i class="fas fa-plus"></i>
            Add Event
          </button>
        </h3>
        ${(!fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "events")).length) ? `<span style="color: grey;">No events found</span>` : fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "events")).map((command) => (command.endsWith(".js")) ? `
          <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;" data-category="events">${this.escapeHtml(command.substring(0, command.length - 3).replace(/[^a-zA-Z]+$/, "")) + ((command.substring(0, command.length - 3).match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(command.substring(0, command.length - 3).match(/[^a-zA-Z]+$/))}</code>` : "")}</div>
        ` : "").join("")}
      `;

      workbenchMainView.querySelectorAll(".add-command-btn").forEach((button, index) => {
        button.addEventListener("click", () => {
          this.addInteractionItem(workspaceView, bot, (!index) ? "commands" : "events");
        });
      });

      workbenchMainView.querySelectorAll(".workbench-section .setting-item").forEach((command) => {
        command.addEventListener("click", () => {
          workbenchView.scrollTop = 0;

          delete require.cache[require.resolve(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, command.textContent.trim() + ".js"))];
          const variables = Object.entries(require(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, command.textContent.trim() + ".js")).variables);

          workbenchEditorView.innerHTML = `
            <h3 class="command-header">
              <i class="fas fa-${(command.dataset.category === "commands") ? "code" : "calendar-days"}"></i><span contenteditable spellcheck="false">${this.escapeHtml((command.dataset.category === "commands") ? command.textContent.trim() : command.textContent.trim().replace(/[^A-Za-z]/g, ""))}</span>
              <button class="add-command-btn" style="position: absolute; right: 39.5px;">
                <i class="fas fa-code"></i>
                Edit in code lab
              </button>
              <button class="add-command-btn" style="position: absolute; right: 0; padding: 0.55rem 0.65rem;">
                <i class="fas fa-trash"></i>
              </button>
            </h3>
            ${(!variables.length) ? `
                <div class="command-item setting-item">
                  <label style="color: grey; cursor: text;">
                    No variables found
                  </label>
                </div>
              ` : variables.map(([id, { title = "", description = "", default: defaultValue = "", type = "text", datalist = null, options = {}, properties = {} } = {}] = [], index) => `
              <div class="command-item setting-item" style="margin-bottom: 1rem;" data-id="${this.escapeHtml(id)}">
                ${(type === "switch") ? `
                  <label>
                    <span>${this.escapeHtml(title)}</span>
                    <input type="checkbox"${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue) ? " checked" : ""} ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}/>
                  </label>
                  ${
                    (description) ? `
                      <div class="setting-description">
                        ${this.escapeHtml(description)}
                      </div>
                    ` : ""
                  }
                ` : `
                  <label style="flex-direction: column;">
                    <span style="text-align: left; position: absolute; left: 0;">${this.escapeHtml(title)}</span>
                    ${
                      (description) ? `
                        <div class="setting-description" style="margin-top: 1.675rem; position: absolute; left: 0;">
                          ${this.escapeHtml(description)}
                        </div>
                      ` : ""
                    }
                    ${(type === "textarea") ? `
                      <textarea style="height: 3.15rem; margin-top: 60px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #00000030; resize: vertical;" placeholder="Enter ${title.toLowerCase()}..." ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>${JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue ?? ""}</textarea>
                    ` : ((type === "select") ? `
                      <select style="margin-top: 60px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #151618;" placeholder="Enter ${title.toLowerCase()}..." ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>
                        ${Object.entries(options).map(([optionId, optionName]) => `
                          <option value="${optionId}">${optionName}</option>
                        `)}
                      </select>
                    ` : `
                      <input type="${type.replace("slider", "range").replace("telephone", "tel").replace("link", "url") || "text"}" ${(type !== "color") ? `style="margin-top: ${(60 - ((type === "slider") * 17.5) - (!description * 31.5)).toString()}px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #00000030;"` : `style="margin-top: ${(55 - (!description * 31.5)).toString()}px;"`}placeholder="Enter ${title.toLowerCase()}..." value="${JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue ?? ""}" ${(datalist) ? `list=workbench-datalist-${index} ` : "" }${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>
                    `)}
                  </label>
                `}
                ${(datalist) ? `
                  <datalist id="workbench-datalist-${index}">
                    ${datalist.map((value) => `
                      <option value="${value}"></option>
                    `)}
                  </datalist>
                ` : ""}
              </div>
            `).join("")}
          `;

          requestAnimationFrame(() => {
            workbenchEditorView.style.setProperty("--workbench-editor-view-scrollbar", (workbenchView.scrollHeight > workbenchView.clientHeight) ? "8px" : "0px");

            workbenchEditorView.querySelectorAll(".command-item.setting-item textarea").forEach((commandItemInput) => {
              commandItemInput.style.height = `${(commandItemInput.scrollHeight + 4.4).toString()}px`;
            });
          });

          workbenchEditorView.querySelector(".command-header span").addEventListener("blur", () => {
            if (workbenchEditorView.querySelector(".command-header span").textContent.trim() === command.textContent.trim()) return;

            fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`), path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${workbenchEditorView.querySelector(".command-header span").textContent.trim()}.js`));

            if (!configFile) (configFile = {});
            if (!configFile.variables) (configFile.variables = {});
            if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
            if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});

            if (configFile.variables[command.dataset.category][command.textContent.trim()]) {
              configFile.variables[command.dataset.category][workbenchEditorView.querySelector(".command-header span").textContent.trim()] = configFile.variables[command.dataset.category][command.textContent.trim()];
              delete configFile.variables[command.dataset.category][command.textContent.trim()];

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            };

            if (command.dataset.category === "commands") {
              command.textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim();
            } else {
              command.innerHTML = (this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().replace(/[^a-zA-Z]+$/, "")) + ((workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/))}</code>` : ""));
            };

            workbenchEditorView.querySelector(".command-header span").textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim().trim().replace(/[^A-Za-z]/g, "");
          });

          workbenchEditorView.querySelector(".command-header span").addEventListener("keydown", (e) => {
            if ((e.key !== "Enter") || (workbenchEditorView.querySelector(".command-header span").textContent.trim() === command.textContent.trim())) return;

            e.preventDefault();

            workbenchEditorView.querySelector(".command-header span").blur();

            fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`), path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${workbenchEditorView.querySelector(".command-header span").textContent.trim()}.js`));

            if (!configFile) (configFile = {});
            if (!configFile.variables) (configFile.variables = {});
            if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
            if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});

            if (configFile.variables[command.dataset.category][command.textContent.trim()]) {
              configFile.variables[command.dataset.category][workbenchEditorView.querySelector(".command-header span").textContent.trim()] = configFile.variables[command.dataset.category][command.textContent.trim()];
              delete configFile.variables[command.dataset.category][command.textContent.trim()];

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            };

            if (command.dataset.category === "commands") {
              command.textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim();
            } else {
              command.innerHTML = (this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().replace(/[^a-zA-Z]+$/, "")) + ((workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/))}</code>` : ""));
            };

            workbenchEditorView.querySelector(".command-header span").textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim().trim().replace(/[^A-Za-z]/g, "");
          });

          workbenchEditorView.querySelectorAll(".command-header button").forEach((button) => {
            button.addEventListener("click", () => {
              if (button.querySelector("i").className === "fas fa-code") {
                this.getFileTreeItem(editorView, command.dataset.category).click();
                this.getFileTreeItem(editorView, `${command.dataset.category}/${command.textContent.trim()}.js`).click();

                Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-code").classList.add("active");
                workbenchView.style.display = "none";
                editorView.style.visibility = "visible";
                editorView.style.animation = "slideUp 0.5s ease";
                setTimeout(() => {
                  editorView.style.animation = "none";
                }, 500);
                editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.remove("animationless"));
              } else if (button.querySelector("i").className === "fas fa-trash") {
                try {
                  this.confirm(`Delete ${command.dataset.category[0].toUpperCase() + command.dataset.category.substring(1, command.dataset.category.length - 1)}`, `Are you sure you want to delete ${command.textContent.trim()}?`, "dangerous").then(() => {
                    fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`));

                    if (workbenchMainView.querySelector(`.workbench-section .setting-item[data-category="${command.dataset.category}"]`).length === 1) {
                      const noItems = document.createElement("span");
                      noItems.style.color = "grey";
                      noItems.textContent = `No ${command.dataset.category} found`;
                      workbenchMainView.querySelector(`.workbench-section h3 i.fa-${command.dataset.category.replace("commands", "code").replace("events", "calendar-days")}`).parentElement.insertBefore(noItems, workbenchMainView.querySelector(`.workbench-section h3 i.fa-${command.dataset.category.replace("commands", "code").replace("events", "calendar-days")}`).parentElement.nextElementSibling);
                    };

                    workbenchEditorView.style.display = "none";
                    workbenchMainView.style.display = "block";
                    workbenchMainView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
                    setTimeout(() => workbenchMainView.style.removeProperty("animation"), 500);
                    Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-tools").classList.add("active");

                    command.remove();
                  }).catch(() => {});
                } catch {};
              };
            });
          });

          workbenchEditorView.querySelectorAll(".command-item.setting-item").forEach((commandItem) => {
            if (!commandItem.dataset.id) return;

            commandItem.querySelector("input, textarea, select").addEventListener("change", (e) => {
              if (!e.target.reportValidity()) return;

              if (!configFile) (configFile = {});
              if (!configFile.variables) (configFile.variables = {});
              if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
              if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});
              configFile.variables[command.dataset.category][command.textContent.trim()][commandItem.dataset.id] = ((e.target.tagName === "INPUT") && (e.target.type === "checkbox")) ? e.target.checked : ((["number", "range"].includes(e.target.type)) ? parseInt(e.target.value) : e.target.value);

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            });
          });

          workbenchMainView.style.display = "none";
          workbenchEditorView.style.display = "block";
          workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
        });
      });

      Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).forEach((tab) => tab.classList.remove("active"));
      Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-code").classList.add("active");
      workbenchView.style.display = "none";
      editorView.style.visibility = "visible";
      editorView.style.animation = "slideUp 0.5s ease";
      setTimeout(() => {
        editorView.style.animation = "none";
      }, 500);
      editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.remove("animationless"));

      const assistant = document.createElement("iframe");
      assistant.style.position = "absolute";
      assistant.style.top = "0";
      assistant.style.left = "0";
      assistant.style.width = "100vw";
      assistant.style.height = "100vh";
      assistant.style.border = "none";
      assistant.style.filter = "invert(95%) hue-rotate(180deg)";
      assistant.src = process.env.SERVER + "/ai";

      assistant.addEventListener("load", () => {
        assistant.contentWindow.postMessage(`You are a skilled software engineer helping to build a Discord bot using a specific development guide. Use the following guide as a reference for best practices, structure, and implementation style:

**Guide (as Markdown):**
${fs.readFileSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/docs/Developer Guide", `${category[0].toUpperCase() + category.substring(1, category.length - 1)}Tutorial.md`) : `./docs/Developer Guide/${category[0].toUpperCase() + category.substring(1, category.length - 1)}Tutorial.md`, "utf8")}

Based on this guide, create a complete and clean implementation of a new Discord bot ${category.substring(0, category.length - 1)}.

• ${category[0].toUpperCase() + category.substring(1, category.length - 1)} Name: ${fileName.substring(0, fileName.length - 3)}
• Description / Prompt: ${prompt}

**Important Instructions:**

• Output code only
• No explanation, no markdown formatting (no triple backticks)
• The code should be fully functional and ready to be dropped into a user’s bot using the guide's structure
• If possible, use embeds to give the responses you give a professional look
• Do not use variables to let any user specify their command arguments. Instead, use them to customize the bot responses / behaviour globally (e.g. response messages).

**The result should include:**

• Full code using the guide’s recommended structure
• Explanations for any key parts if needed
• Use of best practices from the guide

Make sure it is ready to be integrated into the bot codebase with minimal changes.`, "*");
      });

      document.body.appendChild(assistant);

      window.onmessage = ({ data }) => {
        if (data === null) {
          assistant.remove();
          fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), category, fileName), this.editor.getValue(), "utf8");
        } else {
          assistant.style.display = "none";
          this.editor.setValue(this.editor.getValue() + (data || ""));
        };
      };
    });

    window.addEventListener("online", () => {
      suiteMainView.querySelector("#collaborationSection .missing-internet-connection").style.display = "none";
      suiteMainView.querySelector("#collaborationSection .private-join-link").style.display = "block";
      suiteMainView.querySelector("#collaborationSection #privateJoinLink").checked = false;
      suiteMainView.querySelector("#collaborationSection .command-item").style.display = "none";

      if ((this.collaborationRooms || {})[bot.id.toString()]) {
        this.collaborationRooms[bot.id.toString()] = null;
      };
    });

    window.addEventListener("offline", () => {
      suiteMainView.querySelector("#collaborationSection .missing-internet-connection").style.display = "block";
      suiteMainView.querySelector("#collaborationSection .private-join-link").style.display = "none";
      suiteMainView.querySelector("#collaborationSection #privateJoinLink").checked = false;
      suiteMainView.querySelector("#collaborationSection .command-item").style.display = "none";

      if ((this.collaborationRooms || {})[bot.id.toString()]) {
        this.collaborationRooms[bot.id.toString()] = null;
      };
    });

    suiteMainView.querySelector("#collaborationSection #privateJoinLink").addEventListener("change", () => {
      if (suiteMainView.querySelector("#collaborationSection #privateJoinLink").checked) {
        const socketScript = document.createElement("script");
        socketScript.defer = true;
        socketScript.src = process.env.SERVER + "/socket.io/socket.io.js";

        socketScript.addEventListener("load", () => {
          if (!this.collaborationSockets) (this.collaborationSockets = {});
          (this.collaborationSockets || {})[bot.id.toString()] = io(process.env.SERVER);

          (this.collaborationSockets || {})[bot.id.toString()].emit("createRoom");

          (this.collaborationSockets || {})[bot.id.toString()].on("createRoom", (id) => {
            suiteMainView.querySelector("#collaborationSection .command-item").style.display = "block";
            suiteMainView.querySelector("#collaborationSection .command-item input").value = `${process.env.SERVER}/sessions/${encodeURIComponent(id)}`;

            if (!this.collaborationSessions) (this.collaborationSessions = {});
            (this.collaborationSessions || {})[bot.id.toString()] = id;

            (this.collaborationSockets || {})[bot.id.toString()].on("retrieveFileSystem", () => {
              (this.collaborationSockets || {})[bot.id.toString()].emit("retrieveFileSystem", [
                this.getFlatFileList(bot, path.join(process.cwd(), "bots", bot.id.toString())),
                ((dir) => {
                  const files = fs.readdirSync(dir);
                  if (files.includes("index.js")) return "index.js";
                  if (files.includes("package.json")) {
                    try {
                      const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                      if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
                      return "package.json";
                    } catch {
                      return "package.json";
                    };
                  };
                  const firstJsFile = files.find((file) => file.endsWith(".js"));
                  if (firstJsFile) return firstJsFile;
                  const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
                  if (firstNonFolder) return firstNonFolder;
                  const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
                  if (firstFile) return firstFile.substring(2);
                  return null;
                })(path.join(process.cwd(), "bots", bot.id.toString())),
                fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), ((dir) => {
                  const files = fs.readdirSync(dir);
                  if (files.includes("index.js")) return "index.js";
                  if (files.includes("package.json")) {
                    try {
                      const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                      if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
                      return "package.json";
                    } catch {
                      return "package.json";
                    };
                  };
                  const firstJsFile = files.find((file) => file.endsWith(".js"));
                  if (firstJsFile) return firstJsFile;
                  const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
                  if (firstNonFolder) return firstNonFolder;
                  const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
                  if (firstFile) return firstFile.substring(2);
                  return null;
                })(path.join(process.cwd(), "bots", bot.id.toString()))), "utf8")
              ]);

              if (!this.collaborationWatchers) (this.collaborationWatchers = {});
              this.collaborationWatchers[bot.id.toString()] = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), ((dir) => {
                const files = fs.readdirSync(dir);
                if (files.includes("index.js")) return "index.js";
                if (files.includes("package.json")) {
                  try {
                    const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                    if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
                    return "package.json";
                  } catch {
                    return "package.json";
                  };
                };
                const firstJsFile = files.find((file) => file.endsWith(".js"));
                if (firstJsFile) return firstJsFile;
                const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
                if (firstNonFolder) return firstNonFolder;
                const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
                if (firstFile) return firstFile.substring(2);
                return null;
              })(path.join(process.cwd(), "bots", bot.id.toString()))), (eventType) => {
                if (eventType !== "change") return;

                (this.collaborationSockets || {})[bot.id.toString()].emit("newFileContent", [
                  ((dir) => {
                    const files = fs.readdirSync(dir);
                    if (files.includes("index.js")) return "index.js";
                    if (files.includes("package.json")) {
                      try {
                        const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                        if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
                        return "package.json";
                      } catch {
                        return "package.json";
                      };
                    };
                    const firstJsFile = files.find((file) => file.endsWith(".js"));
                    if (firstJsFile) return firstJsFile;
                    const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
                    if (firstNonFolder) return firstNonFolder;
                    const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
                    if (firstFile) return firstFile.substring(2);
                    return null;
                  })(path.join(process.cwd(), "bots", bot.id.toString())),
                  fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), ((dir) => {
                    const files = fs.readdirSync(dir);
                    if (files.includes("index.js")) return "index.js";
                    if (files.includes("package.json")) {
                      try {
                        const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                        if (packageJson.main && fs.existsSync(path.join(dir, packageJson.main))) return packageJson.main;
                        return "package.json";
                      } catch {
                        return "package.json";
                      };
                    };
                    const firstJsFile = files.find((file) => file.endsWith(".js"));
                    if (firstJsFile) return firstJsFile;
                    const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
                    if (firstNonFolder) return firstNonFolder;
                    const firstFile = this.getFlatFileList(bot, dir).find((file) => !fs.statSync(path.join(dir, file.substring(2))).isDirectory());
                    if (firstFile) return firstFile.substring(2);
                    return null;
                  })(path.join(process.cwd(), "bots", bot.id.toString()))), "utf8")
                ]);
              });
            });

            (this.collaborationSockets || {})[bot.id.toString()].on("retrieveFileContent", (fileName) => {
              (this.collaborationSockets || {})[bot.id.toString()].emit("retrieveFileContent", [
                fileName,
                fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), fileName), "utf8") || ""
              ]);

              this.collaborationWatchers[bot.id.toString()] = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), fileName), (eventType) => {
                if (eventType !== "change") return;

                (this.collaborationSockets || {})[bot.id.toString()].emit("newFileContent", [
                  fileName,
                  fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), fileName), "utf8")
                ]);
              });
            });

            (this.collaborationSockets || {})[bot.id.toString()].on("newFileSystem", ([fileAction, fileNames]) => {
              switch (fileAction) {
                case "createFile":
                  fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), fileNames[0]), "", "utf8");
                  break;
                case "createFolder":
                  fs.mkdirSync(path.join(process.cwd(), "bots", bot.id.toString(), fileNames[0]));
                  break;
                case "delete":
                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), fileNames[0]));
                  break;
                case "rename":
                  fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), fileNames[0]), path.join(process.cwd(), "bots", bot.id.toString(), fileNames[1]));
                  break;
              };
            });

            (this.collaborationSockets || {})[bot.id.toString()].on("newFileContent", ([fileName, fileContent]) => {
              if (fileName === this.getFilePath(editorView.querySelector(".file-tree .file-tree-item.active-file"))) {
                if (fileContent === this.editor.getValue()) return;

                this.editor.setValue(fileContent);
              } else {
                if (fileContent === fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), fileName), "utf8")) return;

                fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), fileName), fileContent, "utf8");
              };
            });

            (this.collaborationSockets || {})[bot.id.toString()].on("newLink", (newId) => {
              id = newId;

              document.querySelector("#collaborationSection .command-item input").value = `${process.env.SERVER}/sessions/${encodeURIComponent(newId)}`;
            });
          });

          (this.collaborationSockets || {})[bot.id.toString()].on("disconnect", () => {
            suiteMainView.querySelector("#collaborationSection #privateJoinLink").checked = false;
            suiteMainView.querySelector("#collaborationSection .command-item").style.display = "none";

            (this.collaborationSockets || {})[bot.id.toString()] = null;

            if ((this.collaborationSessions || {})[bot.id.toString()]) {
              (this.collaborationSessions || {})[bot.id.toString()] = null;
            };
          });
        });

        document.head.appendChild(socketScript);
      } else {
        suiteMainView.querySelector("#collaborationSection .command-item").style.display = "none";

        if ((this.collaborationSockets || {})[bot.id.toString()]) {
          (this.collaborationSockets || {})[bot.id.toString()].disconnect();
          (this.collaborationSockets || {})[bot.id.toString()] = null;
        };

        if ((this.collaborationSessions || {})[bot.id.toString()]) {
          (this.collaborationSessions || {})[bot.id.toString()] = null;
        };
      };
    });

    suiteMainView.querySelector("#collaborationSection .command-item input").addEventListener("focus", () => {
      suiteMainView.querySelector("#collaborationSection .command-item input").select();
    });

    suiteMainView.querySelector("#collaborationSection .command-item .copy-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(suiteMainView.querySelector("#collaborationSection .command-item input").value);
      this.showToast("Copied to clipboard", "success", 2000);
    });

    suiteMainView.querySelector("#collaborationSection .command-item .regenerate-link").addEventListener("click", () => {
      if (!(this.collaborationSockets || {})[bot.id.toString()]) return;

      (this.collaborationSockets || {})[bot.id.toString()].emit("newLink");
    });

    new Chart(suiteMainView.querySelector("#analyticsChart"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Servers",
            data: serverData,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            fill: true,
            tension: 0.3
          },
          {
            label: "Users",
            data: userData,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: "Date"
            }
          },
          y: {
            title: {
              display: true,
              text: "Count"
            },
            beginAtZero: true
          }
        }
      }
    });

    const commands = Object.fromEntries(
      (fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/commands.txt"), "utf8") || "").split("\n").filter((line) => line).map((line) => {
        const [key, value] = line.split(":").map((part) => part.trim());
        return [key.toLowerCase(), Number(value)];
      })
    );

    new Chart(suiteMainView.querySelector("#commandsChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(commands),
        datasets: [{
          label: "Command Usage",
          data: Object.values(commands),
          backgroundColor: [
            "#4ECDC4",
            "#556270",
            "#C7F464",
            "#FF6B6B",
            "#C44D58",
            "#69D2E7",
            "#A7DBD8",
            "#E0E4CC",
            "#F38630",
            "#FA6900"
          ],
          borderColor: "#fff",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => ` ${tooltipItem.raw} uses`
            }
          },
          legend: {
            position: "top",
          }
        }
      }
    });

    const events = Object.fromEntries(
      (fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/events.txt"), "utf8") || "").split("\n").filter((line) => line).map((line) => {
        const [key, value] = line.split(":").map((part) => part.trim());
        return [key.toLowerCase(), Number(value)];
      })
    );

    new Chart(suiteMainView.querySelector("#eventsChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(events),
        datasets: [{
          label: "Event Usage",
          data: Object.values(events),
          backgroundColor: [
            "#6C5B7B",
            "#355C7D",
            "#F67280",
            "#F8B195",
            "#C06C84",
            "#11999E",
            "#30E3CA",
            "#40514E",
            "#FFCB05",
            "#D7263D"
          ],
          borderColor: "#fff",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => ` ${tooltipItem.raw} uses`
            }
          },
          legend: {
            position: "top",
          }
        }
      }
    });

    suiteMainView.querySelectorAll("#landingPageSection .add-command-btn").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.querySelector("i").className === "fas fa-plus") {
          const id = Date.now();

          if (!bot.features) (bot.features = []);
          bot.features.push({
            id,
            icon: "star",
            name: "",
            description: ""
          });

          const index = this.bots.findIndex((b) => b.id === bot.id);
          this.bots[index] = bot;

          this.saveBots();

          if (suiteMainView.querySelector("#landingPageSection .grid-container").children[0].tagName === "SPAN") suiteMainView.querySelector("#landingPageSection .grid-container").children[0].remove();

          const featureCard = document.createElement("div");
          featureCard.className = "card";
          featureCard.dataset.id = id;

          featureCard.innerHTML = `
            <i class="fas fa-xmark" style="
              float: right;
              cursor: pointer;
              opacity: 0.85;
            "></i>
            <div class="icon">
              <i class="fas fa-star"></i>
            </div>
            <p class="title" contenteditable spellcheck="false" placeholder="Enter title..."></p>
            <p class="description" contenteditable spellcheck="false" placeholder="Enter description..."></p>
          `;

          featureCard.querySelector("i").addEventListener("click", () => {
            if (!bot.features) (bot.features = []);
            bot.features = bot.features.filter((feature) => feature.id !== id);

            const index = this.bots.findIndex((b) => b.id === bot.id);
            this.bots[index] = bot;

            this.saveBots();

            featureCard.remove();

            if (!suiteMainView.querySelector("#landingPageSection .grid-container").children.length) {
              suiteMainView.querySelector("#landingPageSection .grid-container").innerHTML = `<span style="color: grey; margin-bottom: -0.5rem;">No features found</span>`;
            };
          });

          featureCard.querySelector(".icon i").addEventListener("click", () => {
            this.prompt("Change Feature Icon", "Enter FontAwesome icon name...").then((icon) => {
              if (!this.isFontAwesomeIconAvailable(icon)) return;

              featureCard.querySelector(".icon i").className = `fas fa-${icon}`;

              if (!bot.features) (bot.features = []);
              bot.features.find((feature) => feature.id === id).icon = icon;

              const index = this.bots.findIndex((b) => b.id === bot.id);
              this.bots[index] = bot;

              this.saveBots();
            }).catch(() => {});
          });

          featureCard.querySelectorAll(".title, .description").forEach((featureInput) => {
            featureInput.addEventListener("blur", () => {
              if (!bot.features) (bot.features = []);
              bot.features.find((feature) => feature.id === id)[featureInput.className.replace("title", "name")] = featureInput.textContent;

              const index = this.bots.findIndex((b) => b.id === bot.id);
              this.bots[index] = bot;

              this.saveBots();
            });
          });

          suiteMainView.querySelector("#landingPageSection .grid-container").insertBefore(featureCard, Array.from(suiteMainView.querySelector("#landingPageSection .grid-container").children).at(-1));
        } else if (button.querySelector("i").className === "fas fa-upload") {
          if (!navigator.onLine) return this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");

          this.prompt("Publish Landing Page", "Enter custom subdomain...", null, bot.landingPages).then((subdomain) => {
            if (!subdomain) return;

            const embed = document.createElement("iframe");
            embed.style.position = "absolute";
            embed.style.top = "0";
            embed.style.left = "0";
            embed.style.width = "100vw";
            embed.style.height = "100vh";
            embed.style.border = "none";
            embed.style.filter = "invert(95%) hue-rotate(180deg)";
            embed.src = process.env.SERVER + "/landingPage";

            embed.addEventListener("load", () => {
              embed.contentWindow.postMessage({
                subdomain,
                id: bot.id || Date.now(),
                name: bot.name || "",
                description: bot.description || "",
                stats: [
                  Object.fromEntries(
                    (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/statistics.txt")) || "Servers: 0\nUsers: 0").split("\n").filter((line) => line).map((line) => {
                      const [key, value] = line.split(":").map((part) => part.trim());
                      return [key.toLowerCase(), Number(value)];
                    })
                  ).users,
                  Number(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/messages.txt"), "utf8") || "0"),
                  Object.fromEntries(
                    (this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/statistics.txt")) || "Servers: 0\nUsers: 0").split("\n").filter((line) => line).map((line) => {
                      const [key, value] = line.split(":").map((part) => part.trim());
                      return [key.toLowerCase(), Number(value)];
                    })
                  ).servers
                ],
                invite: fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/invite.txt"), "utf8") || "https://localbotify.app",
                features: bot.features.map((feature) => [
                  feature.icon || "star",
                  feature.name || "",
                  feature.description || ""
                ])
              }, "*");
            });

            document.body.appendChild(embed);

            window.onmessage = ({ data: { err, finished } = {} }) => {
              if (!finished) {
                embed.style.display = "none";
              } else {
                embed.remove();

                if (err) {
                  this.showToast(err, "error");
                } else {
                  this.showToast(`${((bot.landingPages || []).includes(subdomain)) ? "Updated" : "Created"} landing page: ${subdomain}.puter.site`, "success");

                  this.confirm("Open Landing Page", `Would you like to open the landing page you just ${((bot.landingPages || []).includes(subdomain)) ? "updated" : "created"}?`, null, "Open").then(() => {
                    const childProcess = require("child_process");

                    childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + `https://${subdomain}.puter.site"`, (process.platform === "win32") ? {
                      shell: "powershell.exe"
                    } : {});
                  }).catch(() => {});

                  if (!bot.landingPages) (bot.landingPages = []);
                  if (!bot.landingPages.includes(subdomain)) bot.landingPages.push(subdomain);

                  const index = this.bots.findIndex((b) => b.id === bot.id);
                  this.bots[index] = bot;

                  this.saveBots();
                };
              };
            };
          }).catch(() => {});
        } else if (button.querySelector("i").className === "fas fa-arrow-up-right-from-square") {
          this.showLandingPageModal(bot);
        };
      });
    });

    suiteMainView.querySelectorAll("#landingPageSection .grid-container .card").forEach((featureCard) => {
      if (!featureCard.dataset.id) return;

      featureCard.querySelector("i").addEventListener("click", () => {
        if (!bot.features) (bot.features = []);
        bot.features = bot.features.filter((feature) => feature.id.toString() !== featureCard.dataset.id);

        const index = this.bots.findIndex((b) => b.id === bot.id);
        this.bots[index] = bot;

        this.saveBots();

        featureCard.remove();

        if (!suiteMainView.querySelector("#landingPageSection .grid-container").children.length) {
          suiteMainView.querySelector("#landingPageSection .grid-container").innerHTML = `<span style="color: grey; margin-bottom: -0.5rem;">No features found</span>`;
        };
      });

      featureCard.querySelector(".icon i").addEventListener("click", () => {
        this.prompt("Change Feature Icon", "Enter FontAwesome icon name...").then((icon) => {
          if (!this.isFontAwesomeIconAvailable(icon)) return;

          featureCard.querySelector(".icon i").className = `fas fa-${icon}`;

          if (!bot.features) (bot.features = []);
          bot.features.find((feature) => feature.id.toString() === featureCard.dataset.id).icon = icon;

          const index = this.bots.findIndex((b) => b.id === bot.id);
          this.bots[index] = bot;

          this.saveBots();
        }).catch(() => {});
      });

      featureCard.querySelectorAll(".title, .description").forEach((featureInput) => {
        featureInput.addEventListener("blur", () => {
          if (!bot.features) (bot.features = []);
          bot.features.find((feature) => feature.id.toString() === featureCard.dataset.id)[featureInput.className.replace("title", "name")] = featureInput.textContent;

          const index = this.bots.findIndex((b) => b.id === bot.id);
          this.bots[index] = bot;

          this.saveBots();
        });
      });
    });

    suiteMainView.querySelector("#vanityLinksSection .add-command-btn").addEventListener("click", async () => {
      if (!navigator.onLine) return this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");
      if (!fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/invite.txt"), "utf8")) return this.alert("⚠️ Missing Invite Link", "Please run the bot to generate an invite link.");

      const customAlias = await this.prompt("Enter Custom Alias", "Enter a custom alias (optional)").catch(() => {
        return null;
      });

      if (customAlias === null) return;

      const formData = new URLSearchParams();
      formData.append("url", fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "channels/invite.txt"), "utf8"));
      if (customAlias) formData.append("alias", customAlias);

      fetch("https://spoo.me", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData
      })
      .then((response) => response.json())
      .then(({ short_url }) => {
        if (!short_url) return;

        if (!bot.vanityLinks) (bot.vanityLinks = []);
        bot.vanityLinks.push(short_url);

        const index = this.bots.findIndex((b) => b.id === bot.id);
        this.bots[index] = bot;

        this.saveBots();

        if (suiteMainView.querySelector("#vanityLinksSection").querySelector("span")) {
          suiteMainView.querySelector("#vanityLinksSection").querySelector("span").remove();
        };

        const shortenedUrlItem = document.createElement("div");
        shortenedUrlItem.className = "setting-item";
        shortenedUrlItem.style.width = "calc(100% + 12.5px)";
        shortenedUrlItem.style.marginLeft = "-2.5px";
        shortenedUrlItem.style.marginBottom = "0.5rem";
        shortenedUrlItem.style.padding = "0.5rem 1rem";
        shortenedUrlItem.style.cursor = "pointer";
        shortenedUrlItem.innerHTML = this.escapeHtml(short_url);

        shortenedUrlItem.addEventListener("click", async () => {
          const stats = (await (await fetch(`https://spoo.me/stats/${new URL(shortenedUrlItem.textContent.trim()).pathname.substring(1)}`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          })).json()) || {};

          suiteDetailView.innerHTML = `
            <h3 class="command-header">
              <i class="fas fa-link"></i>${new URL(shortenedUrlItem.textContent.trim()).pathname.substring(1)}
              <button class="add-command-btn" style="position: absolute; right: 80px;">
                <i class="fas fa-arrow-up-right-from-square"></i>
                Open
              </button>
              <button class="add-command-btn" style="position: absolute; right: 39px; padding: 0.55rem 0.65rem;">
                <i class="fas fa-copy"></i>
              </button>
              <button class="add-command-btn" style="position: absolute; right: 0; padding: 0.55rem 0.65rem;">
                <i class="fas fa-trash"></i>
              </button>
            </h3>
            <div class="command-item setting-item" style="margin-bottom: 1rem;" data-id="header">
              <pre class="vanity-link-info" style="line-height: 1.75rem; padding-left: 0.5rem;"><span>Original URL:</span> <span><a class="vanity-link-url"${(stats.url) ? ` href="${stats.url}" ` : ""}>${stats.url || "N/A"}</a></span>
<span>Total Clicks:</span> <span>${stats["total-clicks"] || "N/A"}</span>
<span>Total Unique Clicks:</span> <span>${stats.total_unique_clicks || "N/A"}</span>
<span>Creation Date:</span> <span>${stats["creation-date"]}</span>
<span>Average Redirection Time:</span> <span>${(stats.average_redirection_time) ? ((stats.average_redirection_time < 1) ? `${(stats.average_redirection_time * 1000).toFixed(0)} ms` : `${stats.average_redirection_time.toFixed(2)} seconds`) : "N/A"}</span>
<span>Last Click:</span> <span>${stats["last-click"] || "N/A"}</span>
<span>Last Click Browser:</span> <span>${stats["last-click-browser"] || "N/A"}</span>
<span>Last Click OS:</span> <span>${stats["last-click-os"] || "N/A"}</span></pre>
            </div>
            <div style="display: flex; flex-direction: row;">
              <div class="command-item setting-item" style="width: calc((100vw / 3) - (8rem / 3)); height: 30vh; display: flex; justify-content: center; align-items: center;">
                <canvas id="clicksOverTimeChart"></canvas>
              </div>
              <div class="command-item setting-item" style="margin-left: 0.85rem; padding-bottom: 1.5rem; width: calc((100vw / 3) - (8rem / 3)); height: 30vh; display: flex; justify-content: center; align-items: center;">
                ${(stats["total-clicks"]) ? `
                  <canvas id="browserChart"></canvas>
                ` : `
                  <p style="font-size: 1.25rem; font-family: system-ui; text-align: center;">Vanity Link hasn't been clicked yet</p>
                `}
              </div>
              <div class="command-item setting-item" style="margin-left: 0.85rem; width: calc((100vw / 3) - (8rem / 3)); height: 30vh; display: flex; justify-content: center; align-items: center;">
                <canvas id="countryChart"></canvas>
              </div>
            </div>
          `;

          suiteDetailView.querySelectorAll(".command-header button").forEach((button) => {
            button.addEventListener("click", () => {
              if (button.querySelector("i").className === "fas fa-arrow-up-right-from-square") {
                const childProcess = require("child_process");

                childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + shortenedUrlItem.textContent.trim() + `"`, (process.platform === "win32") ? {
                  shell: "powershell.exe"
                } : {});
              } else if (button.querySelector("i").className === "fas fa-copy") {
                navigator.clipboard.writeText(shortenedUrlItem.textContent.trim());
                this.showToast("Copied to clipboard", "success", 2000);
              } else if (button.querySelector("i").className === "fas fa-trash") {
                this.confirm("Delete Vanity Link", `Are you sure you want to delete ${shortenedUrlItem.textContent.trim()}?\nThis will not deactivate the link itself.`, "dangerous").then(() => {
                  shortenedUrlItem.remove();
                  if (!suiteMainView.querySelector("#vanityLinksSection .setting-shortenedUrlItem")) {
                    const noLinks = document.createElement("span");
                    noLinks.style.color = "grey";
                    noLinks.textContent = "No vanity links found";
                    suiteMainView.querySelector("#vanityLinksSection").appendChild(noLinks);
                  };

                  if (!bot.vanityLinks) (bot.vanityLinks = []);
                  bot.vanityLinks = bot.vanityLinks.filter((link) => link !== shortenedUrlItem.textContent.trim());
                  this.saveBots();

                  suiteDetailView.style.display = "none";
                  suiteMainView.style.display = "block";
                  suiteMainView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
                  setTimeout(() => suiteMainView.style.removeProperty("animation"), 500);
                  Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-trophy").classList.add("active");
                }).catch(() => {});
              };
            });
          });

          suiteDetailView.querySelector(".vanity-link-url").addEventListener("click", (e) => {
            e.preventDefault();

            if (!e.target.href) return;

            const childProcess = require("child_process");

            childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + e.target.href + `"`, (process.platform === "win32") ? {
              shell: "powershell.exe"
            } : {});
          });

          await new Promise((resolve, reject) => {
            if (document.querySelector(".chart-script")) resolve();

            const chartScript = document.createElement("script");
            chartScript.src = "../packages/chart.js/chart.js";
            chartScript.className = "chart-script";

            chartScript.addEventListener("load", resolve);

            document.head.appendChild(chartScript);
          });

          const dates = Object.keys(stats.unique_counter);
          const clicksOverTime = Object.values(stats.unique_counter);

          new Chart(suiteDetailView.querySelector("#clicksOverTimeChart"), {
            type: "line",
            data: {
              labels: dates,
              datasets: [{
                label: "Total Clicks",
                data: clicksOverTime,
                fill: false,
                borderColor: '#4bc0c0',
                tension: 0.1,
                pointBackgroundColor: '#4bc0c0',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Clicks"
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: "Date"
                  }
                }
              },
              plugins: {
                tooltip: {
                  mode: "index",
                  intersect: false
                }
              }
            }
          });

          if (stats["total-clicks"]) new Chart(suiteDetailView.querySelector("#browserChart"), {
            type: "doughnut",
            data: {
              labels: Object.keys(stats.browser),
              datasets: [{
                label: "Browser Usage",
                data: Object.values(stats.browser),
                backgroundColor: ["#ffcd56"],
                borderColor: "#fff",
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (tooltipItem) => ` ${tooltipItem.raw} clicks`
                  }
                },
                legend: {
                  position: "top",
                }
              }
            }
          });

          new Chart(suiteDetailView.querySelector("#countryChart"), {
            type: "bar",
            data: {
              labels: Object.keys(stats.country),
              datasets: [{
                label: "Country Traffic",
                data: Object.values(stats.country),
                backgroundColor: "#ff6384",
                borderColor: "#ff6384",
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Number of Clicks"
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} clicks`
                  }
                }
              }
            }
          });

          suiteMainView.style.display = "none";
          suiteDetailView.style.display = "block";
          suiteDetailView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
          setTimeout(() => suiteDetailView.style.removeProperty("animation"), 500);
          workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
        });

        suiteMainView.querySelector("#vanityLinksSection").appendChild(shortenedUrlItem);
      });
    });

    suiteMainView.querySelectorAll("#vanityLinksSection .setting-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const stats = (await (await fetch(`https://spoo.me/stats/${new URL(item.textContent.trim()).pathname.substring(1)}`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        })).json()) || {};

        suiteDetailView.innerHTML = `
          <h3 class="command-header">
            <i class="fas fa-link"></i>${new URL(item.textContent.trim()).pathname.substring(1)}
            <button class="add-command-btn" style="position: absolute; right: 80px;">
              <i class="fas fa-arrow-up-right-from-square"></i>
              Open
            </button>
            <button class="add-command-btn" style="position: absolute; right: 39px; padding: 0.55rem 0.65rem;">
              <i class="fas fa-copy"></i>
            </button>
            <button class="add-command-btn" style="position: absolute; right: 0; padding: 0.55rem 0.65rem;">
              <i class="fas fa-trash"></i>
            </button>
          </h3>
          <div class="command-item setting-item" style="margin-bottom: 1rem;">
            <pre class="vanity-link-info" style="line-height: 1.75rem; padding-left: 0.5rem;"><span>Original URL:</span> <span><a class="vanity-link-url"${(stats.url) ? ` href="${stats.url}" ` : ""}>${stats.url || "N/A"}</a></span>
<span>Total Clicks:</span> <span>${stats["total-clicks"] || "N/A"}</span>
<span>Total Unique Clicks:</span> <span>${stats.total_unique_clicks || "N/A"}</span>
<span>Creation Date:</span> <span>${stats["creation-date"]}</span>
<span>Average Redirection Time:</span> <span>${(stats.average_redirection_time) ? ((stats.average_redirection_time < 1) ? `${(stats.average_redirection_time * 1000).toFixed(0)} ms` : `${stats.average_redirection_time.toFixed(2)} seconds`) : "N/A"}</span>
<span>Last Click:</span> <span>${stats["last-click"] || "N/A"}</span>
<span>Last Click Browser:</span> <span>${stats["last-click-browser"] || "N/A"}</span>
<span>Last Click OS:</span> <span>${stats["last-click-os"] || "N/A"}</span></pre>
          </div>
          <div style="display: flex; flex-direction: row;">
            <div class="command-item setting-item" style="width: calc((100vw / 3) - (8rem / 3)); height: 30vh; display: flex; justify-content: center; align-items: center;">
              <canvas id="clicksOverTimeChart"></canvas>
            </div>
            <div class="command-item setting-item" style="margin-left: 0.85rem; padding-bottom: 1.5rem; width: calc((100vw / 3) - (8rem / 3)); height: 30vh; display: flex; justify-content: center; align-items: center;">
              ${(stats["total-clicks"]) ? `
                <canvas id="browserChart"></canvas>
              ` : `
                <p style="font-size: 1.25rem; font-family: system-ui; text-align: center;">Vanity Link hasn't been clicked yet</p>
              `}
            </div>
            <div class="command-item setting-item" style="margin-left: 0.85rem; width: calc((100vw / 3) - (8rem / 3)); height: 30vh; display: flex; justify-content: center; align-items: center;">
              <canvas id="countryChart"></canvas>
            </div>
          </div>
        `;

        suiteDetailView.querySelectorAll(".command-header button").forEach((button) => {
          button.addEventListener("click", () => {
            if (button.querySelector("i").className === "fas fa-arrow-up-right-from-square") {
              const childProcess = require("child_process");

              childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + item.textContent.trim() + `"`, (process.platform === "win32") ? {
                shell: "powershell.exe"
              } : {});
            } else if (button.querySelector("i").className === "fas fa-copy") {
              navigator.clipboard.writeText(item.textContent.trim());
              this.showToast("Copied to clipboard", "success", 2000);
            } else if (button.querySelector("i").className === "fas fa-trash") {
              this.confirm("Delete Vanity Link", `Are you sure you want to delete ${item.textContent.trim()}?\nThis will not deactivate the link itself.`, "dangerous").then(() => {
                item.remove();
                if (!suiteMainView.querySelector("#vanityLinksSection .setting-item")) {
                  const noLinks = document.createElement("span");
                  noLinks.style.color = "grey";
                  noLinks.textContent = "No vanity links found";
                  suiteMainView.querySelector("#vanityLinksSection").appendChild(noLinks);
                };

                if (!bot.vanityLinks) (bot.vanityLinks = []);
                bot.vanityLinks = bot.vanityLinks.filter((link) => link !== item.textContent.trim());
                this.saveBots();

                suiteDetailView.style.display = "none";
                suiteMainView.style.display = "block";
                suiteMainView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
                setTimeout(() => suiteMainView.style.removeProperty("animation"), 500);
                Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-trophy").classList.add("active");
              }).catch(() => {});
            };
          });
        });

        suiteDetailView.querySelector(".vanity-link-url").addEventListener("click", (e) => {
          e.preventDefault();

          if (!e.target.href) return;

          const childProcess = require("child_process");

          childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + e.target.href + `"`, (process.platform === "win32") ? {
            shell: "powershell.exe"
          } : {});
        });

        await new Promise((resolve, reject) => {
          if (document.querySelector(".chart-script")) resolve();

          const chartScript = document.createElement("script");
          chartScript.src = "../packages/chart.js/chart.js";
          chartScript.className = "chart-script";

          chartScript.addEventListener("load", resolve);

          document.head.appendChild(chartScript);
        });

        const dates = Object.keys(stats.unique_counter);
        const clicksOverTime = Object.values(stats.unique_counter);

        new Chart(suiteDetailView.querySelector("#clicksOverTimeChart"), {
          type: "line",
          data: {
            labels: dates,
            datasets: [{
              label: "Total Clicks",
              data: clicksOverTime,
              fill: false,
              borderColor: '#4bc0c0',
              tension: 0.1,
              pointBackgroundColor: '#4bc0c0',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Clicks"
                }
              },
              x: {
                title: {
                  display: true,
                  text: "Date"
                }
              }
            },
            plugins: {
              tooltip: {
                mode: "index",
                intersect: false
              }
            }
          }
        });

        if (stats["total-clicks"]) new Chart(suiteDetailView.querySelector("#browserChart"), {
          type: "doughnut",
          data: {
            labels: Object.keys(stats.browser),
            datasets: [{
              label: "Browser Usage",
              data: Object.values(stats.browser),
              backgroundColor: ["#ffcd56"],
              borderColor: "#fff",
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (tooltipItem) => ` ${tooltipItem.raw} clicks`
                }
              },
              legend: {
                position: "top",
              }
            }
          }
        });

        new Chart(suiteDetailView.querySelector("#countryChart"), {
          type: "bar",
          data: {
            labels: Object.keys(stats.country),
            datasets: [{
              label: "Country Traffic",
              data: Object.values(stats.country),
              backgroundColor: "#ff6384",
              borderColor: "#ff6384",
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Number of Clicks"
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} clicks`
                }
              }
            }
          }
        });

        suiteMainView.style.display = "none";
        suiteDetailView.style.display = "block";
        suiteDetailView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
        setTimeout(() => suiteDetailView.style.removeProperty("animation"), 500);
        workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
      });
    });
  };

  showPublicationModal(bot) {
    if (!navigator.onLine) return this.alert("⚠️ No Internet Connection", "It seems like you are not connected to the internet!");

    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Publish Bot</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              <label for="botName">Bot Name</label>
              <div style="display: flex; flex-direction: row;">
                <button type="button" id="botAvatar" style="width: fit-content; border-top-right-radius: 0; border-bottom-right-radius: 0; cursor: pointer;">
                  <span${(!this.isEmoji(bot?.avatar)) ? ` style="opacity: 0.6;"` : ""}>${(this.isEmoji(bot?.avatar)) ? this.escapeHtml(bot?.avatar) : "🤖"}</span$>
                </button>
                <input type="text" id="botName" value="${this.escapeHtml(bot.name || "")}" required style="border-top-left-radius: 0; border-bottom-left-radius: 0;">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.55rem;">
              <label for="botDescription">Description (optional)</label>
              <textarea id="botDescription" value="${this.escapeHtml(bot.description || "")}"></textarea>
            </div>
            <div class="form-group">
              <label for="githubRepository">GitHub Repository</label>
              <input type="text" id="githubRepository" required>
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn">
                Publish Bot
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.querySelector("#botAvatar").addEventListener("click", () => {
      this.showEmojiPicker();
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      fetch(process.env.SERVER + "/api/v1/store/add", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          avatar: (this.isEmoji(modal.querySelector("#botAvatar").textContent.trim()) ? modal.querySelector("#botAvatar").textContent.trim() : "🤖"),
          name: modal.querySelector("#botName").value,
          description: modal.querySelector("#botDescription").value,
          repository: modal.querySelector("#githubRepository").value
        })
      })
      .then((response) => response.json())
      .then(({ err }) => {
        if (err) return this.showToast(err, "error");

        this.showToast("Published bot", "success");
      }).catch(() => {});

      closeModal();
    });
  };

  showBotSettings(bot) {
    const path = require("path");

    const modal = document.createElement("div");
    modal.className = "modal";

    let configFile = JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")) || `
      {
        "prefix": "!",
        "slashCommands": "true",
        "status": [
          "Online",
          "Custom",
          "Powered by LocalBotify.app"
        ],
        "footer": "Powered by LocalBotify.app",
        "commands": {
          "initialization": null,
          "startup": ".\\node . "
        },
        "variables": {
          "commands": {},
          "events": {}
        }
      }
    `);

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Bot Settings</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              <label for="initializationCommand">Initialization Command</label>
              <input type="text" id="initializationCommand" value="${this.escapeHtml(configFile?.commands?.initialization || "")}" style="font-family: Consolas;">
            </div>
            <div class="form-group">
              <label for="startupCommand">Startup Command</label>
              <input type="text" id="startupCommand" value="${this.escapeHtml(configFile?.commands?.startup || "")}" style="font-family: Consolas;">
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn">
                Save
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!configFile.commands) (configFile.commands = {});
      configFile.commands.initialization = modal.querySelector("#initializationCommand").value || null;
      configFile.commands.startup = modal.querySelector("#startupCommand").value || null;

      fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");

      closeModal();
    });
  };

  addInteractionItem(workspaceView, bot, category) {
    const path = require("path");

    const workbenchView = workspaceView.querySelector(".workbench-view");
    const workbenchMainView = workbenchView.querySelector("#workbenchMainView");
    const workbenchEditorView = workbenchView.querySelector("#workbenchEditorView");
    const editorView = workspaceView.querySelector(".code-editor-view");

    const modal = document.createElement("div");
    modal.className = "modal";

    let configFile = JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")) || `
      {
        "prefix": "!",
        "slashCommands": "true",
        "status": [
          "Online",
          "Custom",
          "Powered by LocalBotify.app"
        ],
        "footer": "Powered by LocalBotify.app",
        "commands": {
          "initialization": null,
          "startup": ".\\node . "
        },
        "variables": {
          "commands": {},
          "events": {}
        }
      }
    `);

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 750px;">
        <div class="modal-header">
          <h2>Add ${category[0].toUpperCase() + category.substring(1, category.length - 1)}</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              ${(!fs.readdirSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/prebuilt", category) : `./prebuilt/${category}`).length) ? `<span style="color: #d1d1d1;">No ${category} found</span>` : fs.readdirSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/prebuilt", category) : `./prebuilt/${category}`).map((subcategory) => `
                <div class="category-header" style="
                  text-transform: uppercase;
                  font-size: 12px;
                  font-weight: 500;
                  letter-spacing: 0.5px;
                  color: #8e9297;
                  display: flex;
                  align-items: center;
                  user-select: none;
                  transition: background 0.2s;
                  border-bottom: 1px solid #8e929726;
                  padding-bottom: 2.5px;
                  margin-bottom: 10px;
                  cursor: text;
                ">
                  ${Array.from(subcategory).map((character) => (this.isEmoji(character)) ? `<span style="
                    transform: translateY(-0.75px);
                    margin-right: 3.25px;
                  ">${this.escapeHtml(character)}</span>` : this.escapeHtml(character)).join("")}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 15px;">
                  ${fs.readdirSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/prebuilt", category, subcategory) : `./prebuilt/${category}/${subcategory}`).map((interactionItem) => `
                    <div class="setting-item interaction-item" style="width: fit-content; padding: 0.25rem 0.55rem; cursor: pointer; margin: 0; font-size: 0.9rem;">${interactionItem.substring(0, interactionItem.length - 3)}</div>
                  `).join("\n")}
                </div>
              `).join("\n")}
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn" style="opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.2s ease; pointer-events: none;"></button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.querySelectorAll(".interaction-item").forEach((interactionItem) => {
      interactionItem.addEventListener("click", () => {
        interactionItem.classList.toggle("active");

        if (!Array.from(modal.querySelectorAll(".interaction-item")).filter((interactionItem) => interactionItem.classList.contains("active")).length) {
          modal.querySelector(".submit-btn").style.opacity = "0";
          modal.querySelector(".submit-btn").style.pointerEvents = "none";
        } else {
          modal.querySelector(".submit-btn").style.opacity = "1";
          modal.querySelector(".submit-btn").style.pointerEvents = "auto";
          modal.querySelector(".submit-btn").textContent = `Add ${category[0].toUpperCase() + category.substring(1, category.length - 1) + ((Array.from(modal.querySelectorAll(".interaction-item")).filter((interactionItem) => interactionItem.classList.contains("active")).length === 1) ? "" : "s")}`;
        };
      });
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      Array.from(modal.querySelectorAll(".interaction-item")).filter((interactionItem) => interactionItem.classList.contains("active")).forEach((interactionItem) => {
        fs.copyFileSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/prebuilt", category, interactionItem.parentElement.previousElementSibling.textContent.trim(), `${interactionItem.textContent.trim()}.js`) : `./prebuilt/${category}/${interactionItem.parentElement.previousElementSibling.textContent.trim()}/${interactionItem.textContent.trim()}.js`, path.join(process.cwd(), "bots", bot.id.toString(), category, `${interactionItem.textContent.trim()}.js`));
      });

      workbenchMainView.querySelector(".workbench-section").innerHTML = `
        <h3 style="flex-direction: row; margin-bottom: 1rem;">
          <i class="fas fa-code"></i>Commands
          <button class="add-command-btn" style="right: 25px;">
            <i class="fas fa-plus"></i>
            Add Command
          </button>
        </h3>
        ${(!fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "commands")).length) ? `<span style="color: grey;">No commands found</span>` : fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "commands")).map((command) => (command.endsWith(".js")) ? `
          <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;" data-category="commands">${this.escapeHtml(command.substring(0, command.length - 3))}</div>
        ` : "").join("")}
        <h3 style="flex-direction: row; margin-bottom: 1rem; margin-top: 2rem;">
          <i class="fas fa-calendar-days"></i>Events
          <button class="add-command-btn" style="right: 25px;">
            <i class="fas fa-plus"></i>
            Add Event
          </button>
        </h3>
        ${(!fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "events")).length) ? `<span style="color: grey;">No events found</span>` : fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString(), "events")).map((command) => (command.endsWith(".js")) ? `
          <div class="setting-item" style="width: calc(100% + 12.5px); margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;" data-category="events">${this.escapeHtml(command.substring(0, command.length - 3).replace(/[^a-zA-Z]+$/, "")) + ((command.substring(0, command.length - 3).match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(command.substring(0, command.length - 3).match(/[^a-zA-Z]+$/))}</code>` : "")}</div>
        ` : "").join("")}
      `;

      workbenchMainView.querySelectorAll(".add-command-btn").forEach((button, index) => {
        button.addEventListener("click", () => {
          this.addInteractionItem(workspaceView, bot, (!index) ? "commands" : "events");
        });
      });

      workbenchMainView.querySelectorAll(".workbench-section .setting-item").forEach((command) => {
        command.addEventListener("click", () => {
          workbenchView.scrollTop = 0;

          delete require.cache[require.resolve(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, command.textContent.trim() + ".js"))];
          const variables = Object.entries(require(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, command.textContent.trim() + ".js")).variables);

          workbenchEditorView.innerHTML = `
            <h3 class="command-header">
              <i class="fas fa-${(command.dataset.category === "commands") ? "code" : "calendar-days"}"></i><span contenteditable spellcheck="false">${this.escapeHtml((command.dataset.category === "commands") ? command.textContent.trim() : command.textContent.trim().replace(/[^A-Za-z]/g, ""))}</span>
              <button class="add-command-btn" style="position: absolute; right: 39.5px;">
                <i class="fas fa-code"></i>
                Edit in code lab
              </button>
              <button class="add-command-btn" style="position: absolute; right: 0; padding: 0.55rem 0.65rem;">
                <i class="fas fa-trash"></i>
              </button>
            </h3>
            ${(!variables.length) ? `
                <div class="command-item setting-item">
                  <label style="color: grey; cursor: text;">
                    No variables found
                  </label>
                </div>
              ` : variables.map(([id, { title = "", description = "", default: defaultValue = "", type = "text", datalist = null, options = {}, properties = {} } = {}] = [], index) => `
              <div class="command-item setting-item" style="margin-bottom: 1rem;" data-id="${this.escapeHtml(id)}">
                ${(type === "switch") ? `
                  <label>
                    <span>${this.escapeHtml(title)}</span>
                    <input type="checkbox"${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue) ? " checked" : ""} ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}/>
                  </label>
                  ${
                    (description) ? `
                      <div class="setting-description">
                        ${this.escapeHtml(description)}
                      </div>
                    ` : ""
                  }
                ` : `
                  <label style="flex-direction: column;">
                    <span style="text-align: left; position: absolute; left: 0;">${this.escapeHtml(title)}</span>
                    ${
                      (description) ? `
                        <div class="setting-description" style="margin-top: 1.675rem; position: absolute; left: 0;">
                          ${this.escapeHtml(description)}
                        </div>
                      ` : ""
                    }
                    ${(type === "textarea") ? `
                      <textarea style="height: 3.15rem; margin-top: 60px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #00000030; resize: vertical;" placeholder="Enter ${title.toLowerCase()}..." ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>${JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue ?? ""}</textarea>
                    ` : ((type === "select") ? `
                      <select style="margin-top: 60px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #151618;" placeholder="Enter ${title.toLowerCase()}..." ${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>
                        ${Object.entries(options).map(([optionId, optionName]) => `
                          <option value="${optionId}">${optionName}</option>
                        `)}
                      </select>
                    ` : `
                      <input type="${type.replace("slider", "range").replace("telephone", "tel").replace("link", "url") || "text"}" ${(type !== "color") ? `style="margin-top: ${(60 - ((type === "slider") * 17.5) - (!description * 31.5)).toString()}px; width: calc((100vw - 10rem) - 2.5px - var(--workbench-editor-view-scrollbar, 0px)); min-height: 3.15rem; font-family: system-ui; background-color: #00000030;"` : `style="margin-top: ${(55 - (!description * 31.5)).toString()}px;"`}placeholder="Enter ${title.toLowerCase()}..." value="${JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.variables?.[command.dataset.category]?.[command.textContent.trim()]?.[id] ?? defaultValue ?? ""}" ${(datalist) ? `list=workbench-datalist-${index} ` : "" }${Object.entries(properties).map((property) => [this.escapeHtml(property[0]), `"${this.escapeHtml(property[1].toString())}"`].join("=")).join(" ")}>
                    `)}
                  </label>
                `}
                ${(datalist) ? `
                  <datalist id="workbench-datalist-${index}">
                    ${datalist.map((value) => `
                      <option value="${value}"></option>
                    `)}
                  </datalist>
                ` : ""}
              </div>
            `).join("")}
          `;

          requestAnimationFrame(() => {
            workbenchEditorView.style.setProperty("--workbench-editor-view-scrollbar", (workbenchView.scrollHeight > workbenchView.clientHeight) ? "8px" : "0px");

            workbenchEditorView.querySelectorAll(".command-item.setting-item textarea").forEach((commandItemInput) => {
              commandItemInput.style.height = `${(commandItemInput.scrollHeight + 4.4).toString()}px`;
            });
          });

          workbenchEditorView.querySelector(".command-header span").addEventListener("blur", () => {
            if (workbenchEditorView.querySelector(".command-header span").textContent.trim() === command.textContent.trim()) return;

            fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`), path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${workbenchEditorView.querySelector(".command-header span").textContent.trim()}.js`));

            if (!configFile) (configFile = {});
            if (!configFile.variables) (configFile.variables = {});
            if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
            if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});

            if (configFile.variables[command.dataset.category][command.textContent.trim()]) {
              configFile.variables[command.dataset.category][workbenchEditorView.querySelector(".command-header span").textContent.trim()] = configFile.variables[command.dataset.category][command.textContent.trim()];
              delete configFile.variables[command.dataset.category][command.textContent.trim()];

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            };

            if (command.dataset.category === "commands") {
              command.textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim();
            } else {
              command.innerHTML = (this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().replace(/[^a-zA-Z]+$/, "")) + ((workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/))}</code>` : ""));
            };

            workbenchEditorView.querySelector(".command-header span").textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim().trim().replace(/[^A-Za-z]/g, "");
          });

          workbenchEditorView.querySelector(".command-header span").addEventListener("keydown", (e) => {
            if ((e.key !== "Enter") || (workbenchEditorView.querySelector(".command-header span").textContent.trim() === command.textContent.trim())) return;

            e.preventDefault();

            workbenchEditorView.querySelector(".command-header span").blur();

            fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`), path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${workbenchEditorView.querySelector(".command-header span").textContent.trim()}.js`));

            if (!configFile) (configFile = {});
            if (!configFile.variables) (configFile.variables = {});
            if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
            if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});

            if (configFile.variables[command.dataset.category][command.textContent.trim()]) {
              configFile.variables[command.dataset.category][workbenchEditorView.querySelector(".command-header span").textContent.trim()] = configFile.variables[command.dataset.category][command.textContent.trim()];
              delete configFile.variables[command.dataset.category][command.textContent.trim()];

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            };

            if (command.dataset.category === "commands") {
              command.textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim();
            } else {
              command.innerHTML = (this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().replace(/[^a-zA-Z]+$/, "")) + ((workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/)) ? `<code style="background: #242323b0; font-family: monospace; padding: 0.2rem 0.4rem; margin-left: 7.5px; border-radius: var(--radius-sm); position: fixed; height: 23.25px;">${this.escapeHtml(workbenchEditorView.querySelector(".command-header span").textContent.trim().match(/[^a-zA-Z]+$/))}</code>` : ""));
            };

            workbenchEditorView.querySelector(".command-header span").textContent = workbenchEditorView.querySelector(".command-header span").textContent.trim().trim().replace(/[^A-Za-z]/g, "");
          });

          workbenchEditorView.querySelectorAll(".command-header button").forEach((button) => {
            button.addEventListener("click", () => {
              if (button.querySelector("i").className === "fas fa-code") {
                this.getFileTreeItem(editorView, command.dataset.category).click();
                this.getFileTreeItem(editorView, `${command.dataset.category}/${command.textContent.trim()}.js`).click();

                Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-code").classList.add("active");
                workbenchView.style.display = "none";
                editorView.style.visibility = "visible";
                editorView.style.animation = "slideUp 0.5s ease";
                setTimeout(() => {
                  editorView.style.animation = "none";
                }, 500);
                editorView.querySelectorAll(".file-explorer-btn, .file-tree-item, .editor-play-btn").forEach((fileElement) => fileElement.classList.remove("animationless"));
              } else if (button.querySelector("i").className === "fas fa-trash") {
                try {
                  this.confirm(`Delete ${command.dataset.category[0].toUpperCase() + command.dataset.category.substring(1, command.dataset.category.length - 1)}`, `Are you sure you want to delete ${command.textContent.trim()}?`, "dangerous").then(() => {
                    fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), command.dataset.category, `${command.textContent.trim()}.js`));

                    if (workbenchMainView.querySelector(`.workbench-section .setting-item[data-category="${command.dataset.category}"]`).length === 1) {
                      const noItems = document.createElement("span");
                      noItems.style.color = "grey";
                      noItems.textContent = `No ${command.dataset.category} found`;
                      workbenchMainView.querySelector(`.workbench-section h3 i.fa-${command.dataset.category.replace("commands", "code").replace("events", "calendar-days")}`).parentElement.insertBefore(noItems, workbenchMainView.querySelector(`.workbench-section h3 i.fa-${command.dataset.category.replace("commands", "code").replace("events", "calendar-days")}`).parentElement.nextElementSibling);
                    };

                    workbenchEditorView.style.display = "none";
                    workbenchMainView.style.display = "block";
                    workbenchMainView.style.animation = "0.5s ease 0s 1 normal none running slideUp";
                    setTimeout(() => workbenchMainView.style.removeProperty("animation"), 500);
                    Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-tools").classList.add("active");

                    command.remove();
                  }).catch(() => {});
                } catch {};
              };
            });
          });

          workbenchEditorView.querySelectorAll(".command-item.setting-item").forEach((commandItem) => {
            if (!commandItem.dataset.id) return;

            commandItem.querySelector("input, textarea, select").addEventListener("change", (e) => {
              if (!e.target.reportValidity()) return;

              if (!configFile) (configFile = {});
              if (!configFile.variables) (configFile.variables = {});
              if (!configFile.variables[command.dataset.category]) (configFile.variables[command.dataset.category] = {});
              if (!configFile.variables[command.dataset.category][command.textContent.trim()]) (configFile.variables[command.dataset.category][command.textContent.trim()] = {});
              configFile.variables[command.dataset.category][command.textContent.trim()][commandItem.dataset.id] = ((e.target.tagName === "INPUT") && (e.target.type === "checkbox")) ? e.target.checked : ((["number", "range"].includes(e.target.type)) ? parseInt(e.target.value) : e.target.value);

              fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json"), JSON.stringify(configFile, null, 2), "utf8");
            });
          });

          workbenchMainView.style.display = "none";
          workbenchEditorView.style.display = "block";
          workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
        });
      });

      closeModal();
    });
  };

  showLandingPageModal(bot) {
    const childProcess = require("child_process");

    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Open Landing Page</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              ${(!(bot.landingPages || []).length) ? `<span style="color: #d1d1d1;">No landing pages found</span>` : (bot.landingPages || []).map((landingPage) => `
                <div class="setting-item landing-page-item" style="margin-left: -2.5px; margin-bottom: 0.5rem; padding: 0.375rem 1rem; cursor: pointer; background-color: var(--discord-darker);">
                  https://${this.escapeHtml(landingPage)}.puter.site
                  <div>
                    <i class="fas fa-copy"></i>
                  </div>
                </div>
              `).join("\n")}
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.querySelectorAll(".form-group .setting-item.landing-page-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (item.querySelector("div").matches(":hover")) {
          navigator.clipboard.writeText(item.textContent.trim());
          this.showToast("Copied to clipboard", "success", 2000);
        } else {
          childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + item.textContent.trim() + `"`, (process.platform === "win32") ? {
            shell: "powershell.exe"
          } : {});
        };
      });
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  };

  generateFileTree(dir) {
    const path = require("path");

    const result = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        result.push({
          name: file,
          type: "folder",
          files: this.generateFileTree(filePath)
        });
      } else {
        result.push({
          name: file,
          type: "file"
        });
      };
    };

    return result;
  };

  renderFileTree(files, helpView = false) {
    return files.map((file) => {
      if (file.type === "folder") {
        return `
          <div class="file-tree-item folder">
            <i class="fas fa-folder"></i>
            <span>${this.escapeHtml(file.name)}</span>
          </div>
          <div class="folder-content" style="display: none; padding-left: 1rem;">
            ${this.renderFileTree(file.files, helpView)}
          </div>
        `;
      } else {
        const icon = (file.name.endsWith(".json")) ? "fa-file" : "fa-file-code";
        return `
          <div class="file-tree-item" data-filename="${this.escapeHtml(file.path || file.name)}">
            <i class="fas ${icon}"></i>
            <span>${this.escapeHtml(file.name.substring(0, file.name.length - (helpView * 3)))}</span>
          </div>
        `;
      };
    }).join("");
  };

  getFileTreeItem(view, path = "") {
    let parts = path.split("/");
    let container = view.querySelector(".file-tree") || view.querySelector(".help-tree");

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let foundItem = null;

      const items = Array.from(container.children).filter((el) => el.classList.contains("file-tree-item"));
      for (const item of items) {
        const span = item.querySelector("span");
        if (span && ((span.textContent.trim() === part) || (span.parentElement?.dataset?.filename?.trim() === part))) {
          foundItem = item;
          break;
        };
      };

      if (!foundItem) return null;

      if (i === parts.length - 1) {
        return foundItem;
      } else {
        const next = foundItem.nextElementSibling;
        if (!next || !next.classList.contains("folder-content")) {
          return null;
        };
        container = next;
      };
    };

    return null;
  };

  getFilePath(fileItem) {
    let path = [];

    while (fileItem && !fileItem.classList.contains("file-tree")) {
      if (fileItem.classList.contains("file-tree-item")) {
        let span = fileItem.querySelector("span");
        if (span) {
          path.unshift(fileItem.dataset.filename || span.textContent.trim());
        };
      };

      if (fileItem.parentElement && fileItem.parentElement.classList.contains("folder-content")) {
        fileItem = fileItem.parentElement.previousElementSibling;
      } else {
        fileItem = fileItem.parentElement;
      };
    };

    return path.join("/");
  };

  parseFileTree(fileTree) {
    const result = [];
    const stack = [{ node: fileTree, path: "." }];

    while (stack.length > 0) {
      const { node, path } = stack.pop();

      for (let i = 0; i < node.children.length; i++) {
        const el = node.children[i];

        if (el.classList.contains("file-tree-item") && el.classList.contains("folder")) {
          const folderName = el.querySelector("span").textContent.trim();
          const folderPath = `${path}/${folderName}`;

          result.push(folderPath);

          const next = el.nextElementSibling;
          if (next && next.classList.contains("folder-content")) {
            stack.push({ node: next, path: folderPath });
          };
        } else if (el.classList.contains("file-tree-item") && el.dataset.filename) {
          result.push(`${path}/${el.dataset.filename}`);
        };
      };
    };

    return result;
  };

  setupFileTreeListeners(editorView, bot) {
    const path = require("path");

    const fileItems = editorView.querySelectorAll(".file-tree-item");

    fileItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.classList.contains("folder")) {
          fileItems.forEach((i) => i.classList.remove("active"));
          item.classList.add("active");

          item.nextElementSibling.style.display = (item.nextElementSibling.style.display === "none") ? "block" : "none";
        } else {
          editorView.querySelectorAll(".file-tree-item").forEach((i) => i.classList.remove("active", "active-file"));
          item.classList.add("active", "active-file");

          this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)), "utf8"));
          this.editor.clearHistory();
          this.fileWatcher.close();
          this.fileWatcher = fs.watch(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)), (eventType) => {
            if ((eventType !== "change") || (this.editor.getValue() === fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)), "utf8"))) return;

            this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)), "utf8"));

            editorView.querySelector(".editor-play-btn").style.right = (this.editor.getScrollerElement().scrollHeight > this.editor.getScrollerElement().clientHeight) ? "calc(0.5rem + 5px)" : "calc(0.5rem - 2.5px)";
          });

          editorView.querySelector(".editor-play-btn").style.right = (this.editor.getScrollerElement().scrollHeight > this.editor.getScrollerElement().clientHeight) ? "calc(0.5rem + 5px)" : "calc(0.5rem - 2.5px)";
        };
      });

      item.addEventListener("contextmenu", (e) => {
        if (document.body.querySelector(".file-tree-context-menu")) document.body.querySelector(".file-tree-context-menu").remove();

        const contextMenu = document.createElement("div");
        contextMenu.className = "file-tree-context-menu";

        contextMenu.innerHTML = `
          <div class="context-menu-rename-btn">
            <i class="fas fa-pen" style="margin-right: 8.75px;"></i>Rename
          </div>
          <div class="context-menu-delete-btn">
            <i class="fas fa-trash" style="margin-right: 10.5px;"></i>Delete
          </div>
        `;

        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;

        contextMenu.querySelector(".context-menu-rename-btn").addEventListener("click", () => {
          const oldFilePath = this.getFilePath(item);

          const span = item.querySelector("span");
          span.style.cursor = "text";
          span.contentEditable = true;
          span.focus();
          span.addEventListener("blur", () => {
            if (!span.textContent.trim()) return item.remove();
            if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

            span.style.cursor = "pointer";
            span.contentEditable = false;
            item.dataset.filename = span.textContent.trim();
            fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)));

            item.click();
          });

          span.addEventListener("keydown", (e) => {
            if (e.key !== "Enter") return;

            if (!span.textContent.trim()) return item.remove();
            if (editorView.querySelector(".editor-content-missing")) editorView.querySelector(".editor-content-missing").remove();

            span.style.cursor = "pointer";
            span.contentEditable = false;
            item.dataset.filename = span.textContent.trim();
            fs.renameSync(path.join(process.cwd(), "bots", bot.id.toString(), oldFilePath), path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)));

            item.click();
          });
        });

        contextMenu.querySelector(".context-menu-delete-btn").addEventListener("click", () => {
          this.confirm(`Delete ${(item.dataset.filename) ? "File" : "Folder"}`, `Are you sure you want to delete ${this.escapeHtml(item.dataset.filename || item.querySelector("span").textContent.trim())}?`, "dangerous").then(() => {
            item.remove();

            try {
              fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)), "utf8");
            } catch {};
          }).catch(() => {});
        });

        document.body.appendChild(contextMenu);

        window.addEventListener("click", () => {
          contextMenu.remove();
        });
      });
    });
  };

  setupHelpTreeListeners(helpView) {
    const path = require("path");

    const fileItems = helpView.querySelectorAll(".file-tree-item");

    fileItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.classList.contains("folder")) {
          item.nextElementSibling.style.display = (item.nextElementSibling.style.display === "none") ? "block" : "none";
        } else {
          if (item.classList.contains("active")) return;

          fileItems.forEach((i) => i.classList.remove("active"));
          item.classList.add("active");

          const filePath = this.getFilePath(item);

          ipcRenderer.invoke("parseMarkdown", this.escapeHtml(fs.readFileSync((this.isPackaged) ? path.join(process.resourcesPath, "app.asar/docs", filePath) : path.join(__dirname, "../docs", filePath), "utf8"))).then((parsedMarkdown) => {
            helpView.querySelector(".markdown-body").scrollTop = 0;
            helpView.querySelector(".markdown-body").innerHTML = parsedMarkdown;

            helpView.querySelectorAll(".markdown-body a").forEach((link) => {
              link.addEventListener("click", (e) => {
                if (this.isUrl(link.href)) {
                  e.preventDefault();

                  childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + link.href + `"`, (process.platform === "win32") ? {
                    shell: "powershell.exe"
                  } : {});
                };
              });
            });

            helpView.querySelector(".markdown-body").style.animation = "slideUp 0.5s ease";
            setTimeout(() => helpView.querySelector(".markdown-body").style.removeProperty("animation"), 500);

            if (parsedMarkdown.match(/<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/gs)) {
              ipcRenderer.invoke("highlightSyntax", parsedMarkdown).then((syntaxHighlightedMarkdown) => {
                helpView.querySelector(".markdown-body").innerHTML = syntaxHighlightedMarkdown;
              });
            };
          });
        };
      });
    });
  };

  loadCodeHighlighter() {
    if (document.querySelector(".code-highlighter-script")) return hljs.highlightAll();

    let codeHighlighterStylesheet = document.createElement("link");
    codeHighlighterStylesheet.rel = "stylesheet";
    codeHighlighterStylesheet.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css";
    document.head.appendChild(codeHighlighterStylesheet);
    let codeHighlighterScript = document.createElement("script");
    codeHighlighterScript.defer = true;
    codeHighlighterScript.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
    codeHighlighterScript.className = "code-highlighter-script";
    codeHighlighterScript.addEventListener("load", () => {
      [
        "javascript"
      ].forEach((language) => {
        let codeHighlighterLanguageScript = document.createElement("script");
        codeHighlighterLanguageScript.defer = true;
        codeHighlighterLanguageScript.src = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/${language}.min.js`;
        codeHighlighterLanguageScript.addEventListener("load", () => {
          hljs.highlightAll();
        });
        document.head.appendChild(codeHighlighterLanguageScript);
      });
    });
    document.head.appendChild(codeHighlighterScript);
  };

  showBotEditor(bot = null) {
    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${(bot) ? "Edit Bot" : "Create Bot"}</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              <label for="botName">Bot Name</label>
              <div style="display: flex; flex-direction: row;">
                <button type="button" id="botAvatar" style="width: fit-content; border-top-right-radius: 0; border-bottom-right-radius: 0; cursor: pointer;">
                  <span${(!this.isEmoji(bot?.avatar)) ? ` style="opacity: 0.6;"` : ""}>${(this.isEmoji(bot?.avatar)) ? this.escapeHtml(bot?.avatar) : "🤖"}</span$>
                </button>
                <input type="text" id="botName" value="${(bot) ? this.escapeHtml(bot.name) : ""}" required style="border-top-left-radius: 0; border-bottom-left-radius: 0;">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.55rem;">
              <label for="botDescription">Description (optional)</label>
              <textarea id="botDescription">${(bot) ? this.escapeHtml(bot.description) : ""}</textarea>
            </div>
            ${(!bot) ? `<div class="form-group">
              <label for="botToken">Template</label>
              <div>
                <select id="botTemplate" value="ping-pong">
                  <option value="none">No Template</option>
                  <option value="nucleus" selected>LocalBotify NucleusBot</option>
                  <option value="git">Custom GitHub Repository</option>
                </select>
              </div>
            </div>` : ""}
            <div class="form-group">
              <label for="botToken">Bot Token</label>
              <input type="text" id="botToken" value="${(bot) ? this.escapeHtml(require("fs").readFileSync(require("path").join(process.cwd(), "bots", bot.id.toString(), ".env"), "utf8").split("\n").filter((line) => !line.startsWith("#") && (line.split("=").length > 1)).map((line) => line.trim().split(/\/\/|#/)[0].split("=")).reduce((data, accumulator) => ({
                ...data,
                ...{
                  [accumulator[0]]: JSON.parse(accumulator[1].trim())
                }
              }), {}).TOKEN || "") : ""}">
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">
                ${(bot) ? "Update Bot" : "Create Bot"}
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.querySelector("#botAvatar").addEventListener("click", () => {
      this.showEmojiPicker();
    });

    let checkDatalistMatch = (e) => {
      const dataList = modal.querySelector("#templateDatalist");
      const container = e.target.parentElement;
      const options = Array.from(dataList.options).map((option) => [option.dataset.id, option.value]);
      const value = e.target.value;

      if (options.map((option) => option[1]).includes(value)) {
        container.innerHTML = `
          <select id="botTemplate">
            ${options.map(([optionValue, optionName]) => `<option value="${this.escapeHtml(optionValue)}">${this.escapeHtml(optionName)}</option>`).join("\n")}
            <option value="git">Custom GitHub Repository</option>
          </select>
        `;

        Array.from(container.querySelector("#botTemplate").options).find((option) => option.textContent === value).selected = true;

        container.querySelector("#botTemplate").addEventListener("change", toggleInput);
      };
    };

    let toggleInput = (e) => {
      if (e.target.value === "git") {
        const options = Array.from(e.target.options).map((option) => [option.value, option.textContent]).filter(([option]) => option !== "git");

        e.target.parentElement.innerHTML = `
          <input list="templateDatalist" id="botTemplate" placeholder="Enter GitHub Repository...">
          <datalist id="templateDatalist">
            ${options.map(([optionValue, optionName]) => `<option data-id="${this.escapeHtml(optionValue)}" value="${this.escapeHtml(optionName)}">`).join("\n")}
          </datalist>
        `;

        modal.querySelector("#botTemplate").addEventListener("input", checkDatalistMatch);
      };
    };

    if (!bot) modal.querySelector("#botTemplate").addEventListener("change", toggleInput);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);

      if (Array.from(document.querySelectorAll(".nav-item")).find((navItem) => navItem.classList.contains("currentView"))) {
        document.querySelectorAll(".nav-item").forEach((navItem) => {
          navItem.classList.remove("active");
          if (Array.from(navItem.classList).includes("currentView")) {
            navItem.classList.remove("currentView");
            navItem.classList.add("active");
          };
        });
      };
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const newBot = {
        id: (bot) ? bot.id : Date.now(),
        avatar: ((form.querySelector("#botAvatar span").style.opacity !== "0.6") && this.isEmoji(form.querySelector("#botAvatar span").textContent.trim())) ? form.querySelector("#botAvatar span").textContent.trim() : "🤖",
        name: form.querySelector("#botName").value,
        description: form.querySelector("#botDescription").value,
        initialized: (bot) ? bot.initialized : false,
        features: (bot) ? bot.features :  [],
        landingPages: [],
        vanityLinks: (bot) ? bot.vanityLinks :  []
      };

      const path = require("path");

      let replacedToken = false;

      if (bot) {
        const index = this.bots.findIndex((b) => b.id === bot.id);
        this.bots[index] = newBot;

        if (fs.existsSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"))) {
          fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"), fs.readFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"), "utf8").split("\n").map((line) => {
            if (replacedToken) return line;

            if (line.split(/#|\/\//)[0].match(/^\s*TOKEN\s*=/)) {
              replacedToken = true;
              return line.replace(/^\s*TOKEN\s*=.*?(#|\/\/|$)/, `TOKEN="${form.querySelector("#botToken").value}" $1`).trim();
            };

            return line;
          }).join("\n"), "utf8");
        };
      } else {
        this.bots.push(newBot);
        this.initializeTemplate(newBot, ((form.querySelector("#botTemplate").tagName === "INPUT") ? "git:" : "") + form.querySelector("#botTemplate").value).then(() => {
          if (fs.existsSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"))) {
            fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"), fs.readFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), ".env"), "utf8").split("\n").map((line) => {
              if (replacedToken) return line;

              if (line.split(/#|\/\//)[0].match(/^\s*TOKEN\s*=/)) {
                replacedToken = true;
                return line.replace(/^\s*TOKEN\s*=.*?(#|\/\/|$)/, `TOKEN="${form.querySelector("#botToken").value}" $1`).trim();
              };

              return line;
            }).join("\n"), "utf8");
          };
        });
      };

      this.saveBots();
      this.currentView = "bots";
      this.renderContent();
      closeModal();
    });
  };

  async initializeTemplate(newBot, template) {
    const path = require("path");

    if (!fs.readdirSync(process.cwd()).includes("bots")) fs.mkdirSync(path.join(process.cwd(), "bots"));
    if (!fs.readdirSync(path.join(process.cwd(), "bots")).includes(newBot.id.toString())) fs.mkdirSync(path.join(process.cwd(), "bots", newBot.id.toString()));

    if (process.platform === "win32") {
      fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), "node.bat"), `@echo off\n"${path.resolve((this.isPackaged) ? path.join(process.resourcesPath, `app.asar.unpacked/tools/node/win32/${["x64", "arm64"].includes(process.arch) ? process.arch : "x64"}/node.exe`) : `./tools/node/win32/${["x64", "arm64"].includes(process.arch) ? process.arch : "x64"}/node.exe`)}" %*`);
    } else {
      fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), "node"), `#!/bin/bash\n"${path.resolve((this.isPackaged) ? path.join(process.resourcesPath, `app.asar.unpacked/tools/node/${(process.platform === "linux") ? "linux" : "darwin"}/${["x64", "arm64"].includes(process.arch) ? process.arch : "x64"}/node`) : `./tools/node/${(process.platform === "linux") ? "linux" : "darwin"}/${["x64", "arm64"].includes(process.arch) ? process.arch : "x64"}/node`)}" "$@"`, { mode: 0o755 });
    };

    if (template === "none") return;

    if (!template.startsWith("git:")) {
      this.copyRecursiveSync(path.join(__dirname, "../templates", template), path.join(process.cwd(), "bots", newBot.id.toString()));

      if (fs.readdirSync(path.join(path.dirname(__dirname), "templates", template)).includes("files.config") && fs.statSync(path.join(path.dirname(__dirname), "templates", template, "files.config")).isFile()) {
        fs.readFileSync(path.join(path.dirname(__dirname), "templates", template, "files.config"), "utf8").split("```").filter((_, index) => (index % 2)).forEach((configFile) => {
          fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), configFile.split("\n")[0].trim()), configFile.split("\n").slice(1).join("\n").trim().replace(/\$\{([^}]+)\}/g, (_, code) => {
            try {
              return eval(code);
            } catch {};
          }), "utf8");
        });
      };

      ipcRenderer.invoke("runBotCommand", [
        newBot.id,
        ((JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", newBot.id.toString(), "config.json")))?.commands?.initialization) ? ((JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", newBot.id.toString(), "config.json")))?.commands?.initialization || "") + "; ") : "") + `${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", newBot.id.toString(), "config.json")))?.commands?.startup || "")}\r\n`
      ]);
    } else {
      ipcRenderer.invoke("importGitHubRepository", [
        newBot.id,
        template.substring(4)
      ]).then(() => {
        if (fs.readdirSync(path.join(process.cwd(), "bots", newBot.id.toString())).includes("files.config") && fs.statSync(path.join(process.cwd(), "bots", newBot.id.toString(), "files.config")).isFile()) {
          fs.readFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), "files.config"), "utf8").split("```").filter((_, index) => (index % 2)).forEach((configFile) => {
            fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), configFile.split("\n")[0].trim()), configFile.split("\n").slice(1).join("\n").trim().replace(/\$\{([^}]+)\}/g, (_, code) => {
              try {
                return eval(code);
              } catch {};
            }), "utf8");
          });
        };

        ipcRenderer.invoke("runBotCommand", [
          newBot.id,
          ((JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", newBot.id.toString(), "config.json")))?.commands?.initialization) ? ((JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", newBot.id.toString(), "config.json")))?.commands?.initialization || "") + "; ") : "") + `${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", newBot.id.toString(), "config.json")))?.commands?.startup || "")}\r\n`
        ]);
      });
    };
  };

  showUpgradeModal() {
    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>✨ Become a LocalBotify Pro User! ✨</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="upgradeForm">
            <div class="form-group" style="margin-bottom: 1rem;">
              <p style="margin-bottom: 0.5rem;">Looks like you tried to access a LocalBotify Pro feature. 👀</p>
              <p style="text-decoration: underline; color: #ffb100de;">Upgrading only costs 5$ / forever!</p>
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn">
                Upgrade Now
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);

      const workspaceView = document.querySelector(".workspace-view");

      Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.querySelector("i").className === "fas fa-trophy").classList.remove("active");
      Array.from(workspaceView.querySelectorAll(".workspace-tabs button")).find((tab) => tab.classList.contains("currentView")).classList.add("active");
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#upgradeForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      closeModal();

      const childProcess = require("child_process");
      childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + process.env.HOMEPAGE + `/#pricing"`, (process.platform === "win32") ? {
        shell: "powershell.exe"
      } : {});
    });
  };

  showActivationModal() {
    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>✨ Thanks for Becoming a LocalBotify Pro User! ✨</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="upgradeForm">
            <div class="form-group" style="margin-bottom: 1rem;">
              <p style="margin-bottom: 0.5rem;">As the sole developer of this app, I greatly thank you for supporting our cause.</p>
              <p style="color: #ffb100de;"><span style="text-decoration: underline;">Love from Germany!</span> ❤️</p>
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn">
                Start Using Pro
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#upgradeForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      closeModal();
    });
  };

  showEmojiPicker() {
    const modal = document.createElement("div");
    modal.className = "modal";

    document.body.appendChild(modal);

    if (!document.querySelector(".emoji-picker-script")) {
      const emojiPickerScript = document.createElement("script");
      emojiPickerScript.defer = true;
      emojiPickerScript.src = "../packages/picmo/picmo.js";

      emojiPickerScript.addEventListener("load", () => {
        picmo.createPicker({
          rootElement: modal,
          emojiCDN: "../packages/picmo/assets/"
        }).addEventListener("emoji:select", ({ emoji }) => {
          document.querySelector("#botForm #botAvatar span").textContent = emoji;
          document.querySelector("#botForm #botAvatar span").style.removeProperty("opacity");

          closeModal();
        });
      });

      document.head.appendChild(emojiPickerScript);
    } else {
      picmo.createPicker({
        rootElement: modal,
        emojiCDN: "../packages/picmo/assets/"
      }).addEventListener("emoji:select", ({ emoji }) => {
        document.querySelector("#botForm #botAvatar span").textContent = emoji;
        document.querySelector("#botForm #botAvatar span").style.removeProperty("opacity");

        closeModal();
      });
    };

    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  };

  async viewBot(bot) {
    const childProcess = require("child_process");

    const modal = document.createElement("div");
    modal.className = "modal";

    const match = bot.repository.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/)?$/);

    const parsedMarkdown = await ipcRenderer.invoke("parseMarkdown", this.escapeHtml(await (await fetch(`https://raw.githubusercontent.com/${match[1]}/${match[2]}/refs/heads/main/README.md`)).text()));

    modal.innerHTML = `
      <div class="modal-content" style="border-radius: 12.5px;">
        <div class="modal-body markdown-body" style="padding-top: 0; background-color: #151618; border: 1px solid #1f1f1f;">
          <button class="close-btn" style="float: right; transform: translateY(15px);">
            <i class="fas fa-times"></i>
          </button>
          <button class="close-btn like-btn" style="float: right; transform: translateY(15px);">
            <i class="fas fa-thumbs-up"></i>
          </button>
          <form id="botForm" style="padding: 0 10px; margin-top: -8.5px;">
            <div class="form-group">
              ${parsedMarkdown}
            </div>
            <div class="form-actions" style="margin-bottom: 7.5px;">
              <button type="submit" class="submit-btn">
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (!document.querySelector(".markdown-stylesheet")) {
      const markdownStylesheet = document.createElement("link");
      markdownStylesheet.rel = "stylesheet";
      markdownStylesheet.href = "../packages/github-markdown/github-markdown-dark.css";
      markdownStylesheet.className = "markdown-stylesheet";

      document.head.appendChild(markdownStylesheet);
    };

    modal.querySelectorAll(".form-group a").forEach((link) => {
      link.addEventListener("click", (e) => {
        if (this.isUrl(link.href)) {
          e.preventDefault();

          childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + link.href + `"`, (process.platform === "win32") ? {
            shell: "powershell.exe"
          } : {});
        };
      });
    });

    if (parsedMarkdown.match(/<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/gs)) {
      ipcRenderer.invoke("highlightSyntax", parsedMarkdown).then((syntaxHighlightedMarkdown) => {
        modal.querySelector(".form-group").innerHTML = syntaxHighlightedMarkdown;

        modal.querySelectorAll(".form-group a").forEach((link) => {
          link.addEventListener("click", (e) => {
            if (this.isUrl(link.href)) {
              e.preventDefault();

              childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + link.href + `"`, (process.platform === "win32") ? {
                shell: "powershell.exe"
              } : {});
            };
          });
        });
      });
    };

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".like-btn").addEventListener("click", () => {
      fetch(process.env.SERVER + "/api/v1/store/like", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: bot.id
        })
      })
      .then((response) => response.json())
      .then(({ err }) => {
        if (err) return this.showToast(err, "error");

        this.showToast("Liked bot", "success");

        const botGrid = document.getElementById("botGrid");
        const card = Array.from(botGrid.children).find((card) => card.dataset.id === bot.id);

        card.querySelectorAll(".bot-stats .stat-value")[2].textContent = this.formatNumber(Number(card.querySelectorAll(".bot-stats .stat-value")[2].textContent) + 1);
      }).catch(() => {});
    });

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    });
  };

  reportBot(bot) {
    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Report Bot</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              <label for="reportReason">Reason</label>
              <select id="reportReason" required>
                <option value disabled selected hidden>Select a reason</option>
                <option value="malicious">🚨 Malicious Behavior</option>
                <option value="tosViolation">👮 Violating Discord Terms of Service</option>
                <option value="privacyAbuse">🔒 Privacy / Data Abuse</option>
                <option value="broken">💥 Broken / Non-Functional</option>
                <option value="misleading">🧬 Misleading or Fraudulent Description</option>
                <option value="stolen">🎮 Stolen / Uncredited Copy</option>
                <option value="other">🧩 Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="reportContext">Additional Context</label>
              <textarea id="reportContext" required></textarea>
            </div>
            <div class="form-actions" style="margin-top: 0;">
              <button type="submit" class="submit-btn submit-report-btn" style="background-color: var(--discord-red);">
                Report Bot
              </button>
              <button type="button" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      fetch(process.env.SERVER + "/api/v1/reports/add", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: bot.id,
          reason: modal.querySelector("#reportReason").value || "other",
          context: modal.querySelector("#reportContext").value || null
        })
      })
      .then((response) => response.json())
      .then(({ err } = {}) => {
        if (err) return this.showToast(err, "error");

        this.showToast("Reported bot", "success");
      }).catch(() => {});

      closeModal();
    });
  };

  runBots() {
    const path = require("path");

    this.bots.forEach((bot) => {
      ipcRenderer.invoke("runBotCommand", [
        bot.id,
        ((bot.initialized || !JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.commands?.initialization) ? "" : ((JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.commands?.initialization || "") + "; ")) + `${(JSON.parse(this.readFileSafelySync(path.join(process.cwd(), "bots", bot.id.toString(), "config.json")))?.commands?.startup || "")}\r\n`
      ]).then((success) => {
        if (!success || bot.initialized) return;

        bot.initialized = true;

        const index = this.bots.findIndex((b) => b.id === bot.id);
        this.bots[index] = bot;

        this.saveBots();
      });
    });
  };

  setupEventListeners() {
    document.querySelector(".sidebar-header").addEventListener("click", () => {
      this.currentView = "bots";
      this.renderContent();
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (item.classList.contains("active")) return;

        document.querySelectorAll(".nav-item").forEach((navItem) => {
          if (Array.from(navItem.classList).includes("active") && ["Create New", "Feedback"].includes(item.querySelector("span").textContent)) navItem.classList.add("currentView");
          navItem.classList.remove("active");
        });
        item.classList.add("active");

        if (item.querySelector("span").textContent === "My Bots") {
          this.currentView = "bots";
        } else if (item.querySelector("span").textContent === "Create New") {
          this.showBotEditor();
        } else if (item.querySelector("span").textContent === "Bot Store") {
          this.currentView = "store";
        } else if (item.querySelector("span").textContent === "Feedback") {
          this.showFeedbackModal();
        } else if (item.querySelector("span").textContent === "Settings") {
          this.currentView = "settings";
        } else if (item.querySelector("span").textContent === "Help") {
          this.currentView = "help";
        };

        if (["My Bots", "Bot Store", "Settings", "Help"].includes(item.querySelector("span").textContent)) this.renderContent();
      });
    });

    let sidebar = document.querySelector(".sidebar");
    let sidebarResizer = document.querySelector(".sidebar-resizer");
    let isResizing = false;

    let handleResize = (e) => {
      if (!isResizing) return;
      const sidebarLeft = sidebar.getBoundingClientRect().left;
      const newWidth = e.clientX - sidebarLeft;
      sidebar.style.width = Math.min(Number(window.getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width").slice(0, -2)), newWidth) + "px";
    };

    let stopResize = () => {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    };

    sidebarResizer.addEventListener("mousedown", (e) => {
      isResizing = true;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
    });

    document.addEventListener("input", (e) => {
      if (e.target.matches(".search-container input")) {
        const query = e.target.value.toLowerCase();
        const filteredBots = (this.currentView === "bots") ? this.bots.filter((bot) => 
          bot.name.toLowerCase().includes(query) ||
          bot.description.toLowerCase().includes(query)
        ) : Array.from(document.getElementById("botGrid").children).filter((card) => card.dataset.id && card.querySelector(".bot-info").textContent.trim().toLowerCase().includes(query)).map((card) => ({
          id: card.dataset.id
        }));

        const botGrid = document.getElementById("botGrid");
        if (botGrid) {
          Array.from(botGrid.children).forEach((card) => {
            card.style.display = "none"
          });

          if (filteredBots.length === 0) {
            if (!botGrid.querySelector(".no-results")) {
              const noResults = document.createElement("div");
              noResults.className = "no-results";

              noResults.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No bots found matching your search</p>
              `;

              botGrid.appendChild(noResults);
            } else {
              botGrid.querySelector(".no-results").style.display = "block";
            };
          } else {
            filteredBots.forEach((bot, index) => {
              const card = Array.from(botGrid.children).find((card) => (card.dataset.id === bot.id.toString()));
              card.style.animationDelay = `${index * 0.1}s`;
              card.style.display = "block";
            });
          };
        };
      };
    });

    document.addEventListener("click", (e) => {
      if (e.target.matches(".create-btn") || e.target.closest(".create-btn")) {
        this.showBotEditor();
      };
    });

    window.addEventListener("beforeunload", (e) => {
      const path = require("path");

      fs.readdirSync(path.join(process.cwd(), "bots")).forEach((botId) => {
        fs.writeFileSync(path.join(process.cwd(), "bots", botId, "channels/status.txt"), "OFFLINE", "utf8");
        fs.writeFileSync(path.join(process.cwd(), "bots", botId, "channels/process.txt"), "OFFLINE", "utf8");
      });
    });
  };

  async showAnnouncement() {
    if (!navigator.onLine || !(JSON.parse(localStorage.getItem("settings") || "{}").announcementNotifications ?? true)) return;

    const childProcess = require("child_process");

    const repositorySha = (await (await fetch("https://api.github.com/repos/DinoscapeProgramming/LocalBotify-Announcements/git/refs/heads/main")).json()).object.sha;
    const repositoryTreeSha = (await (await fetch(`https://api.github.com/repos/DinoscapeProgramming/LocalBotify-Announcements/git/commits/${repositorySha}`)).json()).tree.sha;
    const repositoryTreeFileSha = (await (await fetch(`https://api.github.com/repos/DinoscapeProgramming/LocalBotify-Announcements/git/trees/${repositoryTreeSha}`)).json()).tree.find(({ path = "" } = {}) => (path === "Announcement.md")).sha;

    if (repositoryTreeFileSha === (localStorage.getItem("lastAnnouncementSha") || process.env.LAST_ANNOUNCEMENT_SHA)) return;

    localStorage.setItem("lastAnnouncementSha", repositoryTreeFileSha);

    const modal = document.createElement("div");
    modal.className = "modal";

    const parsedMarkdown = await ipcRenderer.invoke("parseMarkdown", await (await fetch("https://raw.githubusercontent.com/DinoscapeProgramming/LocalBotify-Announcements/refs/heads/main/Announcement.md")).text());

    modal.innerHTML = `
      <div class="modal-content" style="border-radius: 12.5px;">
        <div class="modal-body markdown-body" style="padding-top: 0; background-color: #151618; border: 1px solid #1f1f1f;">
          <button class="close-btn" style="float: right; transform: translateY(15px);">
            <i class="fas fa-times"></i>
          </button>
          <form id="botForm" style="padding: 0 10px; margin-top: -8.5px;">
            <div class="form-group">
              ${parsedMarkdown}
            </div>
            <div class="form-actions" style="margin-bottom: 7.5px;">
              <button type="submit" class="submit-btn">
                Ok / Roger
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (!document.querySelector(".markdown-stylesheet")) {
      const markdownStylesheet = document.createElement("link");
      markdownStylesheet.rel = "stylesheet";
      markdownStylesheet.href = "../packages/github-markdown/github-markdown-dark.css";
      markdownStylesheet.className = "markdown-stylesheet";

      document.head.appendChild(markdownStylesheet);
    };

    modal.querySelectorAll(".form-group a").forEach((link) => {
      link.addEventListener("click", (e) => {
        if (this.isUrl(link.href)) {
          e.preventDefault();

          childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + link.href + `"`, (process.platform === "win32") ? {
            shell: "powershell.exe"
          } : {});
        };
      });
    });

    if (parsedMarkdown.match(/<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/gs)) {
      ipcRenderer.invoke("highlightSyntax", parsedMarkdown).then((syntaxHighlightedMarkdown) => {
        modal.querySelector(".form-group").innerHTML = syntaxHighlightedMarkdown;

        modal.querySelectorAll(".form-group a").forEach((link) => {
          link.addEventListener("click", (e) => {
            if (this.isUrl(link.href)) {
              e.preventDefault();

              childProcess.exec(((process.platform === "win32") ? `start "` : ((process.platform === "darwin") ? `open "` : `xdg-open "`)) + link.href + `"`, (process.platform === "win32") ? {
                shell: "powershell.exe"
              } : {});
            };
          });
        });
      });
    };

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    });
  };

  alert(title, message = "", mode, buttonText) {
    return new Promise((resolve, reject) => {
      const modal = document.createElement("div");
      modal.className = "modal";

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.escapeHtml(title)}</h2>
            <button class="close-btn"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form id="botForm">
              <div class="form-group">
                ${message.split("\n").map((line) => `<p>${this.escapeHtml(line)}</p>`).join("\n")}
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn${(mode === "dangerous") ? ` submit-report-btn" style="background-color: var(--discord-red);"` : `"`}>
                  ${this.escapeHtml(buttonText || "Ok / Roger")}
                </button>
              </div>
            </form>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add("show"), 10);

      const closeModal = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
        resolve();
      };

      modal.querySelector(".close-btn").addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });

      const form = modal.querySelector("#botForm");
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
        resolve();
      });
    });
  };

  confirm(title, message = "", mode, buttonText) {
    return new Promise((resolve, reject) => {
      const modal = document.createElement("div");
      modal.className = "modal";

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.escapeHtml(title)}</h2>
            <button class="close-btn"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form id="botForm">
              <div class="form-group">
                ${message.split("\n").map((line) => `<p>${this.escapeHtml(line)}</p>`).join("\n")}
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn${(mode === "dangerous") ? ` submit-report-btn" style="background-color: var(--discord-red);"` : `"`}>
                  ${this.escapeHtml(buttonText || title)}
                </button>
                <button type="button" class="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add("show"), 10);

      const closeModal = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
        reject();
      };

      modal.querySelector(".close-btn").addEventListener("click", closeModal);
      modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });

      const form = modal.querySelector("#botForm");
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
        resolve();
      });
    });
  };

  prompt(title, placeholder = "", mode, datalist) {
    return new Promise((resolve, reject) => {
      const modal = document.createElement("div");
      modal.className = "modal";

      let id;
      if (datalist) {
        id = Date.now();
      };

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.escapeHtml(title)}</h2>
            <button class="close-btn"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form id="botForm">
              <div class="form-group">
                <input type="text" id="formInput" placeholder="${placeholder}"${(datalist) ? ` list="datalist-${id.toString()}"` : ""}></input>
                ${(datalist) ? `
                  <datalist id="datalist-${id.toString()}">
                    ${datalist.map((option) => `
                      <option>${this.escapeHtml(option)}</option>
                    `).join("\n")}
                  </datalist>
                ` : ""}
              </div>
              <div class="form-actions" style="margin-top: 0;">
                <button type="submit" class="submit-btn${(mode === "dangerous") ? ` submit-report-btn" style="background-color: var(--discord-red);"` : `"`}>
                  Submit
                </button>
                <button type="button" class="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add("show"), 10);

      const closeModal = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
        reject();
      };

      modal.querySelector(".close-btn").addEventListener("click", closeModal);
      modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });

      const form = modal.querySelector("#botForm");
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);

        resolve(form.querySelector("#formInput").value);
      });
    });
  };

  showToast(message, type = "default", duration = 4000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.innerHTML += `
      <div class="toast-progress" style="animation: shrink ${duration}ms linear forwards;"></div>
    `;

    document.body.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  };

  isFontAwesomeIconAvailable(icon) {
    const testElement = document.createElement("i");
    testElement.className = `fas fa-${icon}`;
    testElement.style.display = "none";
    document.body.appendChild(testElement);

    const style = window.getComputedStyle(testElement, "::before");
    const content = style.getPropertyValue("content");

    document.body.removeChild(testElement);

    return content && (content !== "none") && (content !== '""');
  };

  isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    };
  };

  readFileSafelySync(path) {
    try {
      return fs.readFileSync(path, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") {
        return null;
      } else {
        throw err;
      };
    };
  };

  copyRecursiveSync(source, destination) {
    const path = require("path");

    try {
      const stat = fs.statSync(source);
      if (stat.isDirectory()) {
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(destination, { recursive: true });
        };

        const entries = fs.readdirSync(source);
        for (const entry of entries) {
          const sourcePath = path.join(source, entry);
          const destinationPath = path.join(destination, entry);
          this.copyRecursiveSync(sourcePath, destinationPath);
        };
      } else {
        fs.copyFileSync(source, destination);
      };
    } catch {};
  };

  watchDirectoryRecursive(directory, callback) {
    const path = require("path");

    fs.watch(directory, callback);

    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (entry.isDirectory()) {
        this.watchDirectoryRecursive(path.join(directory, entry.name), callback);
      };
    });
  };

  getFlatFileList(bot, directory) {
    const path = require("path");

    let results = [];

    fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        results = results.concat(this.getFlatFileList(bot, filePath));
      } else {
        results.push(`./${path.relative(path.join(process.cwd(), "bots", bot.id.toString()), filePath).replace("\\", "/")}`);
      };
    });

    return results;
  };

  formatNumber(num) {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    };
    return num.toString();
  };

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/"/g, "&#039;");
  };

  isEmoji(emoji) {
    const emojiRegex = /(?:\p{Emoji}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Emoji})*)/gu;
    const numberOrSpecialCharRegex = /^[0-9]$|[.*+?^${}()|[\]\\]/;
    return emojiRegex.test(emoji) && !numberOrSpecialCharRegex.test(emoji);
  };
};

if (JSON.parse(localStorage.getItem("settings") || "{}").appLock) {
  const blockade = document.createElement("div");
  blockade.style.position = "absolute";
  blockade.style.top = "0";
  blockade.style.left = "0";
  blockade.style.width = "100vw";
  blockade.style.height = "100vh";
  blockade.style.zIndex = "999";

  document.body.appendChild(blockade);

  const content = document.createElement("div");
  content.className = "content no-bots";

  content.innerHTML = `
    <i class="fas fa-spin fa-spinner" style="
      font-size: 5rem;
      margin-bottom: 1.5rem;
      opacity: 0.8;
    "></i>
    <p style="opacity: 0.8; margin-bottom: 0.6rem;">Verifying Access...</p>
  `;

  document.querySelector(".main-content .bot-grid").style.display = "none";
  document.querySelector(".main-content").appendChild(content);

  const embed = window.open(process.env.SERVER + "/appLock", "_blank", "show=no");

  window.addEventListener("message", ({ data: { type } = {} }) => {
    if (!JSON.parse(localStorage.getItem("settings") || "{}").appLock) return;

    if (type === "ready") {
      const binaryString = atob(JSON.parse(localStorage.getItem("settings") || "{}").appLock);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      };

      embed.postMessage({
        type: "verify",
        id: bytes.buffer
      }, "*");
    } else if (type === "verify") {
      embed.close();

      blockade.remove();
      document.querySelector(".main-content .bot-grid").style.display = "grid";

      const app = new LocalBotify();

      if ((require("path").basename(process.execPath) === "electron.exe") || JSON.parse(localStorage.getItem("settings") || "{}").devMode) {
        window.LocalBotify = app;
      };
    } else if (type === "error") {
      content.innerHTML = `
        <i class="fas fa-user-lock" style="
          font-size: 5rem;
          margin-bottom: 1.5rem;
          opacity: 0.8;
        "></i>
        <p style="opacity: 0.8; margin-bottom: 0.6rem;">Access Denied</p>
      `;
    };
  });
} else {
  const app = new LocalBotify();

  if ((require("path").basename(process.execPath) === "electron.exe") || JSON.parse(localStorage.getItem("settings") || "{}").devMode) {
    window.LocalBotify = app;
  };
};