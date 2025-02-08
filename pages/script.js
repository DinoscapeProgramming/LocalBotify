class DiscordBotCreator {
  constructor() {
    this.bots = JSON.parse(localStorage.getItem("bots")) || [];
    this.currentView = "bots";
    if (this.bots.length === 0) {
      this.initializeDemoData();
    }
    this.renderContent();
    this.setupEventListeners();
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
              <i class="fas fa-circle" style="font-size: 0.75rem"></i>
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
        <h3>General Settings</h3>
        <div class="setting-item">
          <label>
            Theme
            <select id="themeSelect">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
        </div>
        <div class="setting-item">
          <label class="switch">
            <p>Enable Compact View</p>
            <input type="checkbox" id="compactView" />
            <span class="slider" style="transform: translateX(162.5px);"></span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Developer Settings</h3>
        <div class="setting-item">
          <label>
            Default Bot Prefix
            <input type="text" id="defaultPrefix" value="!" />
          </label>
        </div>
        <div class="setting-item">
          <label>
            API Request Timeout (ms)
            <input type="number" id="apiTimeout" value="5000" />
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h3>Notifications</h3>
        <div class="setting-item">
          <label class="switch">
            <p>Error Notifications</p>
            <input type="checkbox" id="errorNotifications" checked />
            <span class="slider" style="transform: translateX(140px);"></span>
          </label>
        </div>
        <div class="setting-item">
          <label class="switch">
            <p>Status Change Notifications</p>
            <input type="checkbox" id="statusNotifications" checked />
            <span class="slider" style="transform: translateX(205px);"></span>
          </label>
        </div>
      </div>
    `;

    return settings;
  };

  createTerminalView() {
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
    if (confirm(`Are you sure you want to delete ${bot.name}?`)) {
      this.bots = this.bots.filter(b => b.id !== bot.id);
      this.saveBots();
      this.renderContent();
    };
  };

  setupEventListeners() {
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(navItem => {
          navItem.classList.remove("active");
        });
        item.classList.add("active");
        
        if (item.querySelector("span").textContent === "My Bots") {
          this.currentView = "bots";
        } else if (item.querySelector("span").textContent === "Settings") {
          this.currentView = "settings";
        };
        
        this.renderContent();
      });
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
                <p>No bots found matching your search.</p>
              </div>
            `;
          } else {
            filteredBots.forEach((bot, index) => {
              const card = document.createElement("div");
              card.className = "bot-card";
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