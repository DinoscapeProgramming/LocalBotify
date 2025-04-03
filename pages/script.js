Object.assign(process.env, require("fs").readFileSync(require("path").join("./.env"), "utf8").split("\n").filter((line) => !line.startsWith("#") && (line.split("=").length > 1)).map((line) => line.trim().split("#")[0].split("=")).reduce((data, accumulator) => ({
  ...data,
  ...{
    [accumulator[0]]: JSON.parse(accumulator[1].trim().replace(/\{([^}]+)\}/g, (_, expression) => eval(expression)))
  }
}), {}));
const { ipcRenderer } = require("electron");

class DiscordBotCreator {
  constructor() {
    this.bots = JSON.parse(localStorage.getItem("bots")) || [];
    this.currentView = "bots";
    this.renderContent();
    this.setupEventListeners();
    this.updateSettings();
    this.runBots();
  };

  initializeDemoData() {
    this.bots = [
      {
        id: 1,
        name: "Example Bot",
        description: "Super simple example bot",
        template: "ping-pong-bot",
        status: "offline",
        servers: 0,
        users: 0,
        token: "EXAMPLE TOKEN",
        prefix: "!",
        commands: ["ping"],
        initialized: false
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
      case "help":
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
            <h3${(!bot.description) ? ' style="font-size: 1.2rem; margin-left: 2.5px;"' : ""}>${this.escapeHtml(bot.name)}</h3>
            <p>${this.escapeHtml(bot.description)}</p>
          </div>
          <div class="bot-actions">
            <button class="action-btn code-btn" title="Open Code Editor">
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
        this.confirm("Delete Bot", `Are you sure about deleting ${this.escapeHtml(bot.name)}?`).then(() => {
          this.bots = this.bots.filter((b) => b.id !== bot.id);
          this.saveBots();
          this.renderContent();

          this.saveBots();
          this.renderContent();
          
          const fs = require("fs");
          const path = require("path");

          fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString()));
        }).catch(() => {});
      });

      grid.appendChild(card);
    });

    return grid;
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
              <input type="text" id="feedbackEmail" placeholder="@JohnDoe123" required>
            </div>
            <div class="form-group">
              <label for="feedbackComment">Comment (optional)</label>
              <textarea id="feedbackComment"></textarea>
            </div>
            <div class="form-actions">
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

      document.querySelectorAll(".nav-item").forEach((navItem) => {
        navItem.classList.remove("active");
        if (Array.from(navItem.classList).includes("currentView")) {
          navItem.classList.remove("currentView");
          navItem.classList.add("active");
        };
      });
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModal);
    modal.querySelector(".cancel-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#botForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      fetch(`${process.env.SERVER}/api/v1/feedback/send`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stars: modal.querySelectorAll(".selected-feedback-star").length,
          user: modal.querySelector("#feedbackUser").value,
          comment: modal.querySelector("#feedbackComment").value
        })
      });
      closeModal();
    });
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
              <option value="discord">Discord</option>
              <option value="serenity">Serenity</option>
              <option value="monokai">Monokai</option>
            </select>
          </label>
          <div class="setting-description">
            Customize the look and feel of your LocalBotify application
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
  };

  createHelpView() {
    const helpView = document.createElement("div");
    helpView.className = "help-view show";
    
    helpView.innerHTML = `
      <div class="help-explorer">
        <div class="help-tree">${this.renderFileTree(this.getHelpFileTree())}</div>
      </div>

      <div class="help-container"></div>
    `;

    this.getFileTreeItem(helpView, "README.md").classList.add("active");

    fetch(`https://raw.githubusercontent.com/DinoscapeProgramming/Remote-Control/refs/heads/main/README.md`)
    .then((response) => response.text())
    .then((response) => {
      ipcRenderer.invoke("parseMarkdown", response).then((parsedMarkdown) => {
        helpView.querySelector(".help-container").innerHTML = parsedMarkdown;
        this.loadCodeHighlighter();
      });
    });
    
    this.setupHelpFileTreeListeners(helpView);

    return helpView;
  };
  
  getHelpFileTree() {
    return [
      {
        name: "Introduction",
        path: "README.md"
      }
    ];
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
        const fs = require("fs");
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

        this.editor.on("change", () => {
          const activeFile = editorView.querySelector(".file-tree-item.active");

          if (activeFile) {
            fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(activeFile)), this.editor.getValue(), "utf8");
          };
        });
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
      let terminal = new Terminal({
        rows: Math.round(200 / 17)
      });
      let currentLine = "";

      terminal.open(document.querySelector(".editor-terminal"));
      terminal.onKey((data) => {
        currentLine += data.key;
        ipcRenderer.send("terminalData", [
          bot.id,
          data.key
        ]);
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

  showCodeEditor(bot = null) {
    const fs = require("fs");
    const path = require("path");

    const workspaceView = document.createElement("div");
    workspaceView.className = "workspace-view";

    workspaceView.innerHTML = `
      <div class="workspace-tabs">
        <button class="active">
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
        <div class="bot-header" style="margin-bottom: 1.65rem;">
          <div class="bot-avatar" style="width: 60px; height: 60px;">
            <i class="fas fa-robot" style="font-size: 1.65rem;"></i>
          </div>
          <div class="bot-info">
            <h3 style="font-size: 1.5rem; margin-left: 2.5px;">${this.escapeHtml(bot.name)}</h3>
            <p></p>
          </div>
        </div>
        <div class="setting-item" style="margin-bottom: 0.85rem;">
          <label data-tooltip="Choose the status for your bot">
            <span>Bot Status</span>
            <select id="Language" style="width: fit-content; border-top-right-radius: 0; border-bottom-right-radius: 0;">
              <option value="online">🟢</option>
              <option value="idle">🌙</option>
              <option value="doNotDisturb">🔴</option>
              <option value="invisible">🔘</option>
            </select>
            <input type="text" id="defaultPrefix" value="Ready to assist!" placeholder="Enter status message..." style="width: 9.05rem; margin-left: -0.75rem; border-top-left-radius: 0; border-bottom-left-radius: 0;" />
          </label>
          <div class="setting-description">
            Give your bot a personality
          </div>
        </div>
        <div class="setting-item" style="margin-bottom: 0.85rem;">
          <label data-tooltip="Show yourself using the footer">
            <span>Bot Embed Footer</span>
            <input type="text" id="defaultPrefix" value="Created with LocalBotify.app • {Date.now}" placeholder="Enter footer..." style="width: 19.75rem;" />
          </label>
          <div class="setting-description">
            Customize your bot embed footer
          </div>
        </div>
        <div class="setting-item" style="margin-bottom: 0.85rem;">
          <label data-tooltip="Be ready when something goes wrong">
            <span>Update Notifications</span>
            <input type="checkbox" id="updateNotifications" />
          </label>
          <div class="setting-description">
            Receive notifications when your bot goes up or down
          </div>
          </div>
        </div>
      </div>

      <div class="code-editor-view" style="display: none;">
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
            <i class="fas fa-play"></i>
          </button>
          <div class="editor-content">
            <textarea spellcheck="false">${(fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString())).find((file) => !fs.statSync(path.join(process.cwd(), "bots", bot.id.toString(), file)).isDirectory())) ? this.escapeHtml(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), ((dir) => {
              const files = fs.readdirSync(dir);
              if (files.includes("index.js")) return "index.js";
              if (files.includes("package.json")) {
                try {
                  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
                  if (packageJson.main) return packageJson.main;
                } catch {};
                return "package.json";
              };
              const firstJsFile = files.find((file) => file.endsWith(".js"));
              if (firstJsFile) return firstJsFile;
              const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
              if (firstNonFolder) return firstNonFolder;
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
      
      <div></div>
    `;

    const workbenchView = workspaceView.querySelector(".workbench-view");
    const editorView = workspaceView.querySelector(".code-editor-view");

    workspaceView.querySelectorAll(".workspace-tabs button").forEach((tab) => {
      tab.addEventListener("click", () => {
        workspaceView.querySelectorAll(".workspace-tabs button").forEach((activeTab) => activeTab.classList.remove("active"));
        tab.classList.add("active");

        if (tab.querySelector("i").className === "fas fa-tools") {
          editorView.style.display = "none";
          workbenchView.style.display = "block";
        } else if (tab.querySelector("i").className === "fas fa-code") {
          workbenchView.style.display = "none";
          editorView.style.display = "grid";
        };
      });
    });

    if (fs.readdirSync(path.join(process.cwd(), "bots", bot.id.toString())).find((file) => !fs.statSync(path.join(process.cwd(), "bots", bot.id.toString(), file)).isDirectory())) {
      this.getFileTreeItem(editorView, ((dir) => {
        const files = fs.readdirSync(dir);
        if (files.includes("index.js")) return "index.js";
        if (files.includes("package.json")) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
            if (packageJson.main) return packageJson.main;
          } catch {};
          return "package.json";
        };
        const firstJsFile = files.find((file) => file.endsWith(".js"));
        if (firstJsFile) return firstJsFile;
        const firstNonFolder = files.find((file) => !fs.statSync(path.join(dir, file)).isDirectory());
        if (firstNonFolder) return firstNonFolder;
        return null;
      })(path.join(process.cwd(), "bots", bot.id.toString()))).classList.add("active");
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

          const path = require("path");
          fs.writeFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "", "utf8");

          newFileTreeItem.addEventListener("click", () => {
            const fileItems = editorView.querySelectorAll(".file-tree-item");

            fileItems.forEach(i => i.classList.remove("active"));
            newFileTreeItem.classList.add("active");

            this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"));
          });
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

            fileItems.forEach(i => i.classList.remove("active"));
            newFileTreeItem.classList.add("active");

            this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(newFileTreeItem)), "utf8"));
          });
        });

        ((document.querySelector(".file-tree-item.active")) ? document.querySelector(".file-tree-item.active").parentElement : document.querySelector(".file-tree")).appendChild(newFileTreeItem);
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
            newFolderTreeItem.nextElementSibling.style.display = (newFolderTreeItem.nextElementSibling.style.display === "none") ? "block" : "none";
          });
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
            newFolderTreeItem.nextElementSibling.style.display = (newFolderTreeItem.nextElementSibling.style.display === "none") ? "block" : "none";
          });
        });

        ((document.querySelector(".file-tree-item.active")) ? document.querySelector(".file-tree-item.active").parentElement : document.querySelector(".file-tree")).appendChild(newFolderTreeItem);
        ((document.querySelector(".file-tree-item.active")) ? document.querySelector(".file-tree-item.active").parentElement : document.querySelector(".file-tree")).appendChild(newFolderTreeContent);
        newFolderTreeItem.querySelector("span").focus();
      });
    });

    this.setupFileTreeListeners(editorView, bot);
    this.setupTerminal(editorView);
  };

  generateFileTree(dir) {
    const fs = require("fs");
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

  renderFileTree(files) {
    return files.map((file) => {
      if (file.type === "folder") {
        return `
          <div class="file-tree-item folder">
            <i class="fas fa-folder"></i>
            <span>${this.escapeHtml(file.name)}</span>
          </div>
          <div class="folder-content" style="display: none; padding-left: 1rem;">
            ${this.renderFileTree(file.files)}
          </div>
        `;
      } else {
        const icon = (file.name.endsWith(".json")) ? "fa-file" : "fa-file-code";
        return `
          <div class="file-tree-item" data-filename="${this.escapeHtml(file.path || file.name)}">
            <i class="fas ${icon}"></i>
            <span>${this.escapeHtml(file.name)}</span>
          </div>
        `;
      };
    }).join("");
  };

  getFileTreeItem(view, path) {
    let parts = path.split("/");
    let container = view.querySelector(".file-tree") || view.querySelector(".help-tree");

    for (let part of parts) {
      let items = container.querySelectorAll(".file-tree-item");
      let found = null;

      for (let item of items) {
        if (item.dataset.filename && (item.dataset.filename === part)) {
          found = item;
          break;
        };
      };

      if (!found) return null;

      container = found.nextElementSibling;
      if (!container || !container.classList.contains("folder-content")) {
        return found;
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
          path.unshift(span.textContent.trim());
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

  setupFileTreeListeners(editorView, bot) {
    const fs = require("fs");
    const path = require("path");

    const fileItems = editorView.querySelectorAll(".file-tree-item");
    const editor = editorView.querySelector("textarea");

    fileItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.classList.contains("folder")) {
          item.nextElementSibling.style.display = (item.nextElementSibling.style.display === "none") ? "block" : "none";
        } else {
          fileItems.forEach(i => i.classList.remove("active"));
          item.classList.add("active");

          this.editor.setValue(fs.readFileSync(path.join(process.cwd(), "bots", bot.id.toString(), this.getFilePath(item)), "utf8"));
        };
      });
    });

    editor.addEventListener("input", () => {
      const activeFile = editorView.querySelector(".file-tree-item.active");
      if (activeFile) {
        const fileName = activeFile.dataset.filename;
        const file = bot.files.find(f => f.name === fileName);
        if (file) {
          file.content = editor.value;
          this.saveBots();
        };
      };
    });
  };

  setupHelpFileTreeListeners(helpView) {
    const fileItems = helpView.querySelectorAll(".file-tree-item");
    const helpContainer = helpView.querySelector(".help-container");

    fileItems.forEach(item => {
      item.addEventListener("click", () => {
        if (item.classList.contains("folder")) {
          item.nextElementSibling.style.display = (item.nextElementSibling.style.display === "none") ? "block" : "none";
        } else {
          fileItems.forEach(i => i.classList.remove("active"));
          item.classList.add("active");

          const filePath = item.dataset.filename;

          fetch(`https://raw.githubusercontent.com/DinoscapeProgramming/Remote-Control/refs/heads/main/${filePath}`)
          .then((response) => response.text())
          .then((response) => {
            ipcRenderer.invoke("parseMarkdown", response).then((parsedMarkdown) => {
              helpContainer.innerHTML = parsedMarkdown;
              this.loadCodeHighlighter();
            });
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

  setupTerminal(editorView) {
    return;
    const terminalInput = editorView.querySelector(".terminal-input");
    const terminalContent = editorView.querySelector(".terminal-content");
    
    terminalInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const command = terminalInput.value;
        if (command) {
          terminalContent.innerHTML += `\n> ${command}`;
          terminalInput.value = "";
          
          if (command === "npm start") {
            terminalContent.innerHTML += "\n Starting bot...\n Bot is now online!";
          } else if (command === "help") {
            terminalContent.innerHTML += "\n Available commands: help, npm start, clear";
          } else if (command === "clear") {
            terminalContent.innerHTML = "";
          };
          
          terminalContent.scrollTop = terminalContent.scrollHeight;
        };
      };
    });

    const clearBtn = editorView.querySelector(`.terminal-btn[title="Clear"]`);
    clearBtn.addEventListener("click", () => {
      terminalContent.innerHTML = "";
    });

    const copyBtn = editorView.querySelector(`.terminal-btn[title="Copy"]`);
    copyBtn.addEventListener("click", () => {
      const text = terminalContent.textContent;
      navigator.clipboard.writeText(text);
    });
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
              <input type="text" id="botName" value="${(bot) ? this.escapeHtml(bot.name) : ""}" required>
            </div>
            <div class="form-group">
              <label for="botDescription">Description (optional)</label>
              <textarea id="botDescription">${(bot) ? this.escapeHtml(bot.description) : ""}</textarea>
            </div>
            ${(!bot) ? `<div class="form-group">
              <label for="botToken">Template</label>
              <div>
                <select id="botTemplate" value="ping-pong">
                  <option value="none">No Template</option>
                  <option value="ping-pong" selected>Simple Ping-Pong Bot</option>
                  <option value="git">Custom GitHub Repository</option>
                </select>
              </div>
            </div>` : ""}
            <div class="form-group">
              <label for="botToken">Bot Token (optional)</label>
              <input type="text" id="botToken" value="${(bot) ? this.escapeHtml(bot.token) : ""}">
            </div>
            <div class="form-group">
              <label for="botPrefix">Command Prefix (optional)</label>
              <input type="text" id="botPrefix" value="${(bot) ? this.escapeHtml(bot.prefix) : "!"}" required>
            </div>
            <div class="form-group">
              <label for="botCommands">Commands (comma-separated)</label>
              <input type="text" id="botCommands" value="${(bot) ? this.escapeHtml(bot.commands.join(", ")) : ""}">
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
          <input list="templateDatalist" id="botTemplate" placeholder="Enter GitHub Repository">
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

      document.querySelectorAll(".nav-item").forEach((navItem) => {
        navItem.classList.remove("active");
        if (Array.from(navItem.classList).includes("currentView")) {
          navItem.classList.remove("currentView");
          navItem.classList.add("active");
        };
      });
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
        initialized: false
      };

      if (bot) {
        const index = this.bots.findIndex((b) => b.id === bot.id);
        this.bots[index] = newBot;
      } else {
        this.bots.push(newBot);
        this.initializeTemplate(newBot, ((form.querySelector("#botTemplate").tagName === "INPUT") ? "git:" : "") + form.querySelector("#botTemplate").value);
      };

      this.saveBots();
      this.currentView = "bots";
      this.renderContent();
      closeModal();
    });
  };

  async initializeTemplate(newBot, template) {
    const fs = require("fs");
    const path = require("path");

    if (!fs.readdirSync(process.cwd()).includes("bots")) fs.mkdirSync(path.join(process.cwd(), "bots"));
    if (!fs.readdirSync(path.join(process.cwd(), "bots")).includes(newBot.id.toString())) fs.mkdirSync(path.join(process.cwd(), "bots", newBot.id.toString()));

    if (template === "none") return;
    
    if (!template.startsWith("git:")) {
      fs.readdirSync(path.join(process.cwd(), "templates", template)).forEach((file) => {
        fs.cpSync(path.join(path.join(process.cwd(), "templates", template), file), path.join(process.cwd(), "bots", newBot.id.toString(), file), { recursive: true });
      });

      if (fs.readdirSync(path.join(process.cwd(), "templates", template)).includes("files.config") && fs.statSync(path.join(process.cwd(), "templates", template, "files.config")).isFile()) {
        fs.readFileSync(path.join(process.cwd(), "templates", template, "files.config"), "utf8").split("```").filter((_, index) => (index % 2)).forEach((configFile) => {
          fs.writeFileSync(path.join(process.cwd(), "bots", newBot.id.toString(), configFile.split("\n")[0].trim()), configFile.split("\n").slice(1).join("\n").trim().replace(/\$\{([^}]+)\}/g, (_, code) => {
            try {
              return eval(code);
            } catch {};
          }), "utf8");
        });
      };
    } else {
      const url = `${template.substring(4)}/archive/refs/heads/main.zip`;

      /*try {
        const response = await fetch(url);
        response.body.pipeTo(require("unzipper").Extract({ path: path.join(process.cwd(), "bots", newBot.id.toString()) }));
      } catch (err) { console.log(err); };*/

      const directory = await require("unzipper").Open.url(require("request"), url);
      return new Promise((resolve, reject) => {
        directory.files[0]
        .stream()
        .pipe(fs.createWriteStream(path.join(process.cwd(), "bots", newBot.id.toString())))
        .on("error", reject)
        .on("finish", resolve)
      });
    };
  };

  runBots() {
    const fs = require("fs");
    const path = require("path");

    this.bots.forEach(async (bot) => {
      let readConfigFile = (configPath) => Object.assign(process.env, fs.readFileSync(path.join(configPath), "utf8").split("\n").filter((line) => !line.startsWith("#") && (line.split("=").length > 1)).map((line) => line.trim().split(/\/\/|#/)[0].split("=")).reduce((data, accumulator) => ({
        ...data,
        ...{
          [accumulator[0]]: JSON.parse(accumulator[1].trim())
        }
      }), {}));

      let configFile;
      try {
        configFile = readConfigFile(path.join(process.cwd(), "bots", bot.id.toString(), ".env"));
      } catch {
        configFile = {};
      };
      
      if (!bot.initialized && !configFile.INITIALIZATION_COMMAND) {
        try {
          configFile.INITIALIZATION_COMMAND = await this.prompt("Enter Initialization Command");
        } catch {};
      };
      
      if (!configFile.STARTUP_COMMAND) {
        try {
          configFile.STARTUP_COMMAND = await this.prompt("Enter Startup Command");
        } catch {};
      };

      ipcRenderer.invoke("runBotCommand", [
        bot.id,
        ((bot.initialized) ? (configFile.INITIALIZATION_COMMAND + "; ") : "") + configFile.STARTUP_COMMAND
      ]).then((success) => {
        if (!success) return;

        const newBot = bot;
        newBot.initialized = true;

        const index = this.bots.findIndex((b) => b.id === bot.id);
        this.bots[index] = newBot;

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
          this.currentView = "settings";
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
                    <button class="action-btn code-btn" title="Open Code Editor">
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
                this.confirm("Delete Bot", `Are you sure about deleting ${this.escapeHtml(bot.name)}?`).then(() => {
                  this.bots = this.bots.filter((b) => b.id !== bot.id);
                  this.saveBots();
                  this.renderContent();

                  this.saveBots();
                  this.renderContent();

                  const fs = require("fs");
                  const path = require("path");

                  fs.unlinkSync(path.join(process.cwd(), "bots", bot.id.toString()));
                }).catch(() => {});
              });

              document.getElementById("botGrid").appendChild(card);
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
  
  prompt(title, placeholder = "") {
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
                <input type="text" id="formInput" placeholder="${placeholder}"></input>
              </div>
              <div class="form-actions" style="margin-top: 0;">
                <button type="submit" class="submit-btn">
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

        closeModal();
 
        resolve(form.querySelector("#formInput").value);
      });
    });
  };
  
  confirm(title, message) {
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
                ${this.escapeHtml(message)}
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn">
                  ${this.escapeHtml(title)}
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