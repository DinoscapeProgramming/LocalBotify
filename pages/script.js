class DiscordBotCreator {
  constructor() {
    this.bots = JSON.parse(localStorage.getItem("bots")) || [];
    this.currentView = "bots";
    if (this.bots.length === 0) {
      this.initializeDemoData();
    }
    this.renderContent();
    this.setupEventListeners();
    this.updateSettings();
  };

  initializeDemoData() {
    this.bots = [
      {
        id: 1,
        name: "Moderator Bot",
        description: "Advanced moderation and user management",
        status: "online",
        servers: 128,
        users: 25600,
        token: "MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.Ghj2k8.abc123",
        prefix: "!",
        commands: ["ban", "kick", "mute", "warn"],
        logs: [
          { timestamp: "2025-01-20 10:30:00", message: "Bot started successfully" },
          { timestamp: "2025-01-20 10:30:05", message: "Connected to Discord API" }
        ]
      },
      {
        id: 2,
        name: "Music Master",
        description: "High-quality music streaming for your server",
        status: "online",
        servers: 256,
        users: 45800,
        token: "OTg3NjU0MzIxMDk4NzY1NDMyMQ.Xyz789.def456",
        prefix: "-",
        commands: ["play", "pause", "skip", "queue"],
        logs: [
          { timestamp: "2025-01-20 09:15:00", message: "Music service initialized" }
        ]
      }
    ];
    this.saveBots();
  };

  saveBots() {
    localStorage.setItem("bots", JSON.stringify(this.bots));
  };

  renderContent() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = "";

    const header = this.createHeader();
    mainContent.appendChild(header);

    const content = document.createElement("div");
    content.className = "content";

    switch (this.currentView) {
      case "bots":
        content.appendChild(this.createBotGrid());
        break;
      case "settings":
        content.appendChild(this.createSettingsPanel());
        break;
      case "terminal":
        content.appendChild(this.createTerminalView());
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
    } else {
      header.innerHTML = `
        <h2 class="view-title">${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}</h2>
      `;
    };

    return header;
  };

  createBotGrid() {
    const grid = document.createElement("div");
    grid.className = "bot-grid";
    grid.id = "botGrid";

    this.bots.forEach((bot, index) => {
      const card = document.createElement("div");
      card.className = "bot-card";
      card.style.animationDelay = `${index * 0.1}s`;

      const statusColor = bot.status === "online" ? "var(--discord-green)" : "var(--discord-red)";

      card.innerHTML = `
        <div class="bot-header">
          <div class="bot-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="bot-info">
            <h3>${this.escapeHtml(bot.name)}</h3>
            <p>${this.escapeHtml(bot.description)}</p>
          </div>
          <div class="bot-actions">
            <button class="action-btn edit-btn" title="Edit Bot">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn terminal-btn" title="View Terminal">
              <i class="fas fa-terminal"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete Bot">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="bot-stats">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="color: ${statusColor}">
              <i class="fas fa-circle" style="font-size: 0.75rem; transform: translateY(-2.5px);"></i>
              ${bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Servers</div>
            <div class="stat-value">${this.formatNumber(bot.servers)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Users</div>
            <div class="stat-value">${this.formatNumber(bot.users)}</div>
          </div>
        </div>
      `;

      const editBtn = card.querySelector(".edit-btn");
      const terminalBtn = card.querySelector(".terminal-btn");
      const deleteBtn = card.querySelector(".delete-btn");

      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showBotEditor(bot);
      });

      terminalBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showBotTerminal(bot);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteBot(bot);
      });

      grid.appendChild(card);
    });

    return grid;
  };

  createSettingsPanel() {
    const settings = document.createElement("div");
    settings.className = "settings-panel";
    
    settings.innerHTML = `
      <div class="settings-section">
        <h3><i class="fas fa-palette"></i>Appearance</h3>
        <div class="setting-item">
          <label data-tooltip="Choose between dark and light theme">
            Theme
            <select id="themeSelect">
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </label>
          <div class="setting-description">
            Customize the look and feel of your Discord Bot Creator
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Save space with a compact layout">
            <span>Compact View</span>
            <input type="checkbox" id="compactView" />
          </label>
          <div class="setting-description">
            Reduce spacing and show more content at once
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Show or hide bot statistics">
            <span>Show Statistics</span>
            <input type="checkbox" id="showStats" checked />
          </label>
          <div class="setting-description">
            Display server count and user statistics on bot cards
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3><i class="fas fa-code"></i>Developer Settings</h3>
        <div class="setting-item">
          <label data-tooltip="Default prefix for new bots">
            Default Bot Prefix
            <input type="text" id="defaultPrefix" value="!" placeholder="Enter prefix..." />
          </label>
          <div class="setting-description">
            Set the default command prefix for newly created bots
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Timeout for API requests">
            API Request Timeout
            <input type="number" id="apiTimeout" value="5000" min="1000" step="1000" />
            <div class="setting-item-spinner-buttons">
              <button aria-label="Increment" onclick="this.parentElement.previousElementSibling.value++;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <button aria-label="Decrement" onclick="this.parentElement.previousElementSibling.value--;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </label>
          <div class="setting-description">
            Maximum time to wait for API responses (in milliseconds)
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Enable development mode">
            <span>Developer Mode</span>
            <input type="checkbox" id="devMode" />
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
            <input type="checkbox" id="errorNotifications" checked />
          </label>
          <div class="setting-description">
            Receive notifications when errors occur
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Get notified about status changes">
            <span>Status Notifications</span>
            <input type="checkbox" id="statusNotifications" checked />
          </label>
          <div class="setting-description">
            Receive notifications when bot status changes
          </div>
        </div>
        <div class="setting-item">
          <label data-tooltip="Get notified about updates">
            <span>Update Notifications</span>
            <input type="checkbox" id="updateNotifications" checked />
          </label>
          <div class="setting-description">
            Receive notifications about new features and updates
          </div>
        </div>
      </div>

      <button class="settings-save-btn">
        <i class="fas fa-save"></i>
        Save Changes
      </button>
    `;

    const saveBtn = settings.querySelector(".settings-save-btn");
    saveBtn.addEventListener("click", () => {
      localStorage.setItem("settings", JSON.stringify({
        theme: document.getElementById("themeSelect").value,
        compactView: document.getElementById("compactView").checked,
        showStats: document.getElementById("showStats").checked,
        defaultPrefix: document.getElementById("defaultPrefix").value,
        apiTimeout: Number(document.getElementById("apiTimeout").value),
        devMode: document.getElementById("devMode").checked,
        errorNotifications: document.getElementById("errorNotifications").checked,
        statusNotifications: document.getElementById("statusNotifications").checked,
        updateNotifications: document.getElementById("updateNotifications").checked
      }));
      this.updateSettings();

      saveBtn.innerHTML = "<i class='fas fa-check'></i>Saved!";
      saveBtn.style.backgroundColor = "var(--discord-green)";
      
      setTimeout(() => {
        saveBtn.innerHTML = "<i class='fas fa-save'></i>Save Changes";
        saveBtn.style.backgroundColor = "var(--discord-primary)";
      }, 2000);

    });

    return settings;
  };

  updateSettings() {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");

    if (settings.theme === "light") {
      document.documentElement.style.filter = "invert(95%) hue-rotate(180deg)";
    } else {
      document.documentElement.style.removeProperty("filter");
    };
  };

  createTerminalView() {
    const childProcess = require("child_process");
    const terminal = document.createElement("div");
    terminal.className = "terminal-view";
    
    terminal.innerHTML = `
      <div class="terminal-header">
        <select class="bot-select">
          ${this.bots.map(bot => `
            <option value="${bot.id}">${this.escapeHtml(bot.name)}</option>
          `).join("")}
        </select>
        <div class="terminal-actions">
          <button class="clear-btn">Clear</button>
          <button class="copy-btn">Copy</button>
        </div>
      </div>
      <div class="terminal-content">
        ${this.bots[0]?.logs.map(log => `
          <div class="log-entry">
            <span class="timestamp">${log.timestamp}</span>
            <span class="message">${this.escapeHtml(log.message)}</span>
          </div>
        `).join("") || ""}
      </div>
      <div class="terminal-input">
        <span class="prompt">></span>
        <input type="text" placeholder="Enter command..." />
      </div>
    `;

    const botSelect = terminal.querySelector(".bot-select");
    const terminalContent = terminal.querySelector(".terminal-content");
    const input = terminal.querySelector(".terminal-input input");
    const clearBtn = terminal.querySelector(".clear-btn");
    const copyBtn = terminal.querySelector(".copy-btn");

    botSelect.addEventListener("change", (e) => {
      const bot = this.bots.find(b => b.id === parseInt(e.target.value));
      if (bot) {
        terminalContent.innerHTML = bot.logs.map(log => `
          <div class="log-entry">
            <span class="timestamp">${log.timestamp}</span>
            <span class="message">${this.escapeHtml(log.message)}</span>
          </div>
        `).join("");
      };
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const command = e.target.value;
        const bot = this.bots.find(b => b.id === parseInt(botSelect.value));
        if (bot && command) {
          const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
          bot.logs.push({
            timestamp,
            message: `$ ${command}`
          });
          this.saveBots();
          terminalContent.innerHTML += `
            <div class="log-entry">
              <span class="timestamp">${timestamp}</span>
              <span class="message">$ ${this.escapeHtml(command)}</span>
            </div>
          `;
          e.target.value = "";
          terminalContent.scrollTop = terminalContent.scrollHeight;

          let commandProcess = childProcess.spawn(command, [], {
            shell: true
          });
          let commandStdoutText;
          let commandStderrText;
          commandProcess.stdout.on("data", (data) => {
            if (!commandStdoutText) {
              commandStdoutText = document.createElement("div");
              commandStdoutText.className = "log-entry";
              commandStdoutText.innerHTML = `
                <span class="timestamp">${new Date().toISOString().replace("T", " ").slice(0, 19)}</span>
                <span class="message">${this.escapeHtml(data.toString())}</span>
              `;
              terminalContent.appendChild(commandStdoutText);
            } else {
              commandStdoutText.querySelector(".message").innerText += data.toString();
            };
            terminalContent.scrollTop = terminalContent.scrollHeight;
          });
          commandProcess.stderr.on("data", (data) => {
            if (!commandStderrText) {
              commandStderrText = document.createElement("div");
              commandStderrText.className = "log-entry";
              commandStderrText.style.color = "red";
              commandStderrText.innerHTML = `
                <span class="timestamp">${new Date().toISOString().replace("T", " ").slice(0, 19)}</span>
                <span class="message">${this.escapeHtml(data.toString())}</span>
              `;
              terminalContent.appendChild(commandStderrText);
            } else {
              commandStderrText.querySelector(".message").innerText += data.toString();
            };
            terminalContent.scrollTop = terminalContent.scrollHeight;
          });
        };
      };
    });

    clearBtn.addEventListener("click", () => {
      terminalContent.innerHTML = "";
    });

    copyBtn.addEventListener("click", () => {
      const text = Array.from(terminalContent.querySelectorAll(".log-entry"))
        .map(entry => `${entry.querySelector(".timestamp").textContent} ${entry.querySelector(".message").textContent}`)
        .join("\n");
      navigator.clipboard.writeText(text);
    });

    return terminal;
  };

  showBotEditor(bot = null) {
    const modal = document.createElement("div");
    modal.className = "modal";
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${bot ? "Edit Bot" : "Create Bot"}</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              <label for="botName">Bot Name</label>
              <input type="text" id="botName" value="${bot ? this.escapeHtml(bot.name) : ""}" required>
            </div>
            <div class="form-group">
              <label for="botDescription">Description</label>
              <textarea id="botDescription" required>${bot ? this.escapeHtml(bot.description) : ""}</textarea>
            </div>
            <div class="form-group">
              <label for="botToken">Bot Token</label>
              <input type="text" id="botToken" value="${bot ? this.escapeHtml(bot.token) : ""}" required>
            </div>
            <div class="form-group">
              <label for="botPrefix">Command Prefix</label>
              <input type="text" id="botPrefix" value="${bot ? this.escapeHtml(bot.prefix) : "!"}" required>
            </div>
            <div class="form-group">
              <label for="botCommands">Commands (comma-separated)</label>
              <input type="text" id="botCommands" value="${bot ? this.escapeHtml(bot.commands.join(", ")) : ""}" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">
                ${bot ? "Update Bot" : "Create Bot"}
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
      
      const newBot = {
        id: bot ? bot.id : Date.now(),
        name: form.querySelector("#botName").value,
        description: form.querySelector("#botDescription").value,
        token: form.querySelector("#botToken").value,
        prefix: form.querySelector("#botPrefix").value,
        commands: form.querySelector("#botCommands").value.split(",").map(cmd => cmd.trim()),
        status: bot ? bot.status : "offline",
        servers: bot ? bot.servers : 0,
        users: bot ? bot.users : 0,
        logs: bot ? bot.logs : []
      };

      if (bot) {
        const index = this.bots.findIndex(b => b.id === bot.id);
        this.bots[index] = newBot;
      } else {
        this.bots.push(newBot);
      };

      this.saveBots();
      this.renderContent();
      closeModal();
    });
  };

  showBotTerminal(bot) {
    this.currentView = "terminal";
    this.renderContent();
    const botSelect = document.querySelector(".bot-select");
    if (botSelect) {
      botSelect.value = bot.id;
      botSelect.dispatchEvent(new Event("change"));
    };
  };

  deleteBot(bot) {
    const modal = document.createElement("div");
    modal.className = "modal";
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Delete Bot</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form id="botForm">
            <div class="form-group">
              Are you sure about deleting this bot?
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">
                Delete Bot
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
      
      this.bots = this.bots.filter(b => b.id !== bot.id);
      this.saveBots();
      this.renderContent();

      this.saveBots();
      this.renderContent();
      closeModal();
    });
  };

  setupEventListeners() {
    document.querySelector(".sidebar-header").addEventListener("click", () => {
      this.currentView = "bots";
      this.renderContent();
    });

    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(navItem => {
          navItem.classList.remove("active");
        });
        item.classList.add("active");

        if (item.querySelector("span").textContent === "Create New") return;
        if (item.querySelector("span").textContent === "My Bots") {
          this.currentView = "bots";
        } else if (item.querySelector("span").textContent === "Settings") {
          this.currentView = "settings";
        };
        
        this.renderContent();
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
        const filteredBots = this.bots.filter(bot => 
          bot.name.toLowerCase().includes(query) ||
          bot.description.toLowerCase().includes(query)
        );
        
        const botGrid = document.getElementById("botGrid");
        if (botGrid) {
          botGrid.innerHTML = "";
          
          if (filteredBots.length === 0) {
            botGrid.innerHTML = `
              <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No bots found matching your search</p>
              </div>
            `;
          } else {
            filteredBots.forEach((bot, index) => {
              const card = document.createElement("div");
              card.className = "bot-card";
              card.style.animationDelay = `${index * 0.1}s`;

              const statusColor = bot.status === "online" ? "var(--discord-green)" : "var(--discord-red)";

              card.innerHTML = `
                <div class="bot-header">
                  <div class="bot-avatar">
                    <i class="fas fa-robot"></i>
                  </div>
                  <div class="bot-info">
                    <h3>${this.escapeHtml(bot.name)}</h3>
                    <p>${this.escapeHtml(bot.description)}</p>
                  </div>
                  <div class="bot-actions">
                    <button class="action-btn edit-btn" title="Edit Bot">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn terminal-btn" title="View Terminal">
                      <i class="fas fa-terminal"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete Bot">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div class="bot-stats">
                  <div class="stat">
                    <div class="stat-label">Status</div>
                    <div class="stat-value" style="color: ${statusColor}">
                      <i class="fas fa-circle" style="font-size: 0.75rem; transform: translateY(-2.5px);"></i>
                      ${bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                    </div>
                  </div>
                  <div class="stat">
                    <div class="stat-label">Servers</div>
                    <div class="stat-value">${this.formatNumber(bot.servers)}</div>
                  </div>
                  <div class="stat">
                    <div class="stat-label">Users</div>
                    <div class="stat-value">${this.formatNumber(bot.users)}</div>
                  </div>
                </div>
              `;

              document.getElementById("botGrid").appendChild(card);
            });
          };
        };
      };
    });

    document.addEventListener("click", (e) => {
      if (e.target.matches(".create-btn") || e.target.matches(".create-new-btn") || e.target.closest(".create-btn") || e.target.closest(".create-new-btn")) {
        this.showBotEditor();
      };
    });
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
};

new DiscordBotCreator();