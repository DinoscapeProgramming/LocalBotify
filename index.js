Object.assign(process.env, require("fs").readFileSync(require("path").join(__dirname, ".env"), "utf8").split("\n").filter((line) => !line.startsWith("#") && (line.split("=").length > 1)).map((line) => line.trim().split("#")[0].split("=")).reduce((data, accumulator) => ({
  ...data,
  ...{
    [accumulator[0]]: JSON.parse(accumulator[1].trim().replaceAll(/\{([^}]+)\}/g, (_, expression) => eval(expression)))
  }
}), {}));
const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, autoUpdater, nativeTheme } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { parse } = require("markdown-wasm");
const unzipper = require("unzipper");
const nodeFetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const contextMenu = require("electron-context-menu").default;

let highlighter;
let tray;
let ptyProcesses = [];
let isQuitting = false;
let startupWindowMaximized = false;

contextMenu({
  showSaveImageAs: true,
  showInspectElement: false
});

const createWindow = () => {
  const window = new BrowserWindow({
    show: false,
    title: "LocalBotify",
    icon: path.join(__dirname, "assets/favicon.png"),
    autoHideMenuBar: true,
    skipTaskbar: app.getLoginItemSettings().wasOpenedAtLogin || process.argv.includes("--startup"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: (app.getLoginItemSettings().wasOpenedAtLogin || process.argv.includes("--startup")) ? [
        "--startup",
        `--cwd=${app.getAppPath()}`
      ] : []
    }
  });
  if (!app.getLoginItemSettings().wasOpenedAtLogin && !process.argv.includes("--startup")) window.maximize();
  window.loadFile("pages/index.html");
  if (tray || (!app.getLoginItemSettings().wasOpenedAtLogin && !process.argv.includes("--startup"))) {
    window.show();
  } else {
    tray = new Tray(path.join(__dirname, "assets/favicon.png"));
    tray.setToolTip("LocalBotify");
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          if ((app.getLoginItemSettings().wasOpenedAtLogin || process.argv.includes("--startup")) && !startupWindowMaximized) {
            startupWindowMaximized = true;
            window.maximize();
          };
          window.show();
          window.setSkipTaskbar(false);
          tray.destroy();
          tray = null;
        }
      },
      {
        label: "Exit",
        click: () => {
          isQuitting = true;

          Object.values(ptyProcesses).forEach((ptyProcess) => {
            try {
              ptyProcess.kill();
            } catch {};
          });

          app.quit();
        }
      }
    ]));
  };

  ipcMain.on("updateElectronApp", () => {
    autoUpdater.setFeedURL({
      ...{
        url: "https://update.electronjs.org" + (new URL(require("./package.json").repository)).pathname + "/" + process.platform + "-" + process.arch + "/" + app.getVersion() + ((process.platform === "darwin") ? "/RELEASES.json" : "")
      },
      ...(process.platform === "darwin") ? {
        headers: {
          'User-Agent': "update-electron-app/3.0.0 (" + os.platform() + ": " + os.arch() + ")"
        },
        serverType: "json"
      } : {}
    });

    autoUpdater.on("update-downloaded", (_, releaseNotes, releaseName) => {
      dialog.showMessageBox({
        type: "info",
        buttons: [
          "Restart",
          "Later"
        ],
        title: "Application Update",
        message: (process.platform === "win32") ? releaseNotes : releaseName,
        detail: "A new version has been downloaded. Restart the application to apply the updates."
      }).then((returnValue) => {
        if (returnValue.response) return;
        autoUpdater.quitAndInstall();
      });
    });
  });

  ipcMain.on("openTerminal", (_, botId) => {
    if (ptyProcesses[botId]) return;

    ptyProcesses[botId] = require("@lydell/node-pty").spawn((require("os").platform() === "win32") ? "powershell.exe" : "bash", [], {
      name: "xterm-color",
      rows: Math.round(200 / 17),
      cwd: path.join(process.cwd(), "bots", botId.toString()),
      env: process.env
    });

    ptyProcesses[botId].on("data", (data) => {
      try {
        window.webContents.send("terminalData", [
          botId,
          data
        ]);
      } catch {};
    });
  });

  ipcMain.on("resizeTerminal", (_, [botId, cols]) => {
    try {
      ptyProcesses[botId].resize(cols, Math.round(200 / 17));
    } catch {};
  });

  ipcMain.on("terminalData", (_, [botId, data]) => {
    try {
      ptyProcesses[botId].write(data);
    } catch {};
  });
  
  ipcMain.handle("runBotCommand", (_, [botId, command]) => {
    if (ptyProcesses[botId]) {
      ptyProcesses[botId].write(command);
      return true;
    };

    if (!fs.existsSync(path.join(process.cwd(), "bots", botId.toString()))) return;

    ptyProcesses[botId] = require("@lydell/node-pty").spawn((require("os").platform() === "win32") ? "powershell.exe" : "bash", [], {
      name: "xterm-color",
      cols: 165,
      rows: Math.round(200 / 17),
      cwd: path.join(process.cwd(), "bots", botId.toString()),
      env: process.env
    });
    
    ptyProcesses[botId].on("data", (data) => {
      try {
        window.webContents.send("terminalData", [
          botId,
          data
        ]);
      } catch {};
    });

    try {
      ptyProcesses[botId].write(command);
    } catch {
      return false;
    } finally {
      return true;
    };
  });

  ipcMain.on("closeTerminal", (_, botId) => {
    if (ptyProcesses[botId]) {
      try {
        ptyProcesses[botId].kill();
        delete ptyProcesses[botId];
      } catch {};
    };
  });

  ipcMain.handle("importGitHubRepository", async (_, [botId, repo]) => {
    const url = `${repo}/archive/refs/heads/main.zip`;
    const outputDirectory = path.join(process.cwd(), "bots", botId.toString());

    try {
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
      };

      const response = await nodeFetch(url);
      if (response.ok) {
        response.body.pipe(unzipper.Parse()).on("entry", (entry) => {
          const entryPath = entry.path;
          const outputPath = path.join(outputDirectory, entryPath.replace(`${repo.match(/github\.com[:\/](.+?)\/(.+?)(?:\.git)?$/)[2]}-main/`, ""));

          if (entry.type === "Directory") {
            fs.mkdirSync(outputPath, { recursive: true });
          } else {
            entry.pipe(fs.createWriteStream(outputPath));
          };
        });
      };
    } catch {};
  });

  ipcMain.handle("parseMarkdown", (_, markdown) => {
    return parse(markdown)
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'");
  });

  ipcMain.handle("highlightSyntax", async (_, html) => {
    if (!highlighter) (highlighter = await (await import("shiki")).createHighlighter({
      themes: [
        "material-theme-ocean"
      ],
      langs: [
        "javascript"
      ]
    }));

    const highlightedHtml = await Promise.all(
      [...html.matchAll(/<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/gs)].map(async (match) => {
        const lang = match[1].replace("language-js", "javascript");
        const code = match[2]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&apos;/g, "'");

        try {
          const highlightedCode = await highlighter.codeToHtml(code, { lang, theme: "material-theme-ocean" });

          return highlightedCode;
        } catch {};
      })
    );

    const resultHtml = html.replace(/<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/gs, () => highlightedHtml.shift());

    return resultHtml;
  });

  window.on("close", (e) => {
    if (isQuitting) return;

    e.preventDefault();

    if (tray) return (tray.destroy(), tray = null);
    window.hide();
    window.setSkipTaskbar(true);
    tray = new Tray(path.join(__dirname, "assets/favicon.png"));
    tray.setToolTip("LocalBotify");
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          if ((app.getLoginItemSettings().wasOpenedAtLogin || process.argv.includes("--startup")) && !startupWindowMaximized) {
            startupWindowMaximized = true;
            window.maximize();
          };
          window.show();
          window.setSkipTaskbar(false);
          tray.destroy();
          tray = null;
        }
      },
      {
        label: "Exit",
        click: () => {
          isQuitting = true;

          Object.values(ptyProcesses).forEach((ptyProcess) => {
            try {
              ptyProcess.kill();
            } catch {};
          });

          app.quit()
        }
      }
    ]));
  });

  if (app.isPackaged) {
    window.webContents.once("did-finish-load", () => {
      window.webContents.on("before-input-event", (_, input) => {
        window.webContents.executeJavaScript(`localStorage.getItem("settings");`).then((settings) => {
          if (!JSON.parse(settings || "{}").devMode && (input.control || input.meta) && input.shift && (input.key.toLowerCase() === "i")) {
            window.webContents.closeDevTools();
          };
        });
      });
    });

    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath("exe"),
      args: [
        "--startup"
      ]
    });
  };

  app.on("second-instance", () => {
    if (tray) {
      window.show();
      window.setSkipTaskbar(false);
      tray.destroy();
      tray = null;
    } else {
      if (window.isMinimized()) window.restore();
      window.focus();
    };
  });
};

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(() => {
  createWindow();

  nativeTheme.themeSource = "dark";

  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    Object.values(ptyProcesses).forEach((ptyProcess) => {
      try {
        ptyProcess.kill();
      } catch {};
    });

    app.quit();
  };
});