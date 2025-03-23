Object.assign(process.env, require("fs").readFileSync(require("path").join("./.env"), "utf8").split("\n").filter((line) => !line.startsWith("#") && (line.split("=").length > 1)).map((line) => line.trim().split("#")[0].split("=")).reduce((data, accumulator) => ({
  ...data,
  ...{
    [accumulator[0]]: JSON.parse(accumulator[1].trim().replaceAll(/\{([^}]+)\}/g, (_, expression) => eval(expression)))
  }
}), {}));
if (!require("fs").readdirSync(process.resourcesPath).includes("autoLaunchType.txt")) require("fs").writeFileSync(require("path").join(process.resourcesPath, "autoLaunchType.txt"), "foreground");
if (!require("fs").readdirSync(process.resourcesPath).includes("customServer.json")) require("fs").writeFileSync(require("path").join(process.resourcesPath, "customServer.json"), "{}");
if (!require("fs").readdirSync(process.resourcesPath).includes("prompt.vbs")) {
  require("fs").mkdir(require("path").join(process.resourcesPath, "nativePrompts"), () => {
    require("fs").writeFileSync(require("path").join(process.resourcesPath, "nativePrompts/win32.vbs"), `box = InputBox(Wscript.Arguments.Item(1), Wscript.Arguments.Item(0), Wscript.Arguments.Item(2))\nWscript.Echo "RETURN" + box`, "utf8");
    require("fs").writeFileSync(require("path").join(process.resourcesPath, "nativePrompts/darwin.scpt"), `on run (clp)\ndisplay dialog clp's item 2 with title clp's item 1 default answer clp's item 3 buttons {"Cancel", "OK"} default button 2\nend run`, "utf8");
    require("fs").writeFileSync(require("path").join(process.resourcesPath, "nativePrompts/linux.sh"), `zenity --entry --title="$1" --text="$2" --entry-text="$3" ""`, "utf8");
  });
};
const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, autoUpdater } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { parse } = require("markdown-wasm");
let tray;
let ptyProcess;

const createWindow = () => {
  const window = new BrowserWindow({
    show: false,
    title: "LocalBotify",
    icon: path.join(__dirname, "assets/favicon.png"),
    autoHideMenuBar: true,
    skipTaskbar: ((app.getLoginItemSettings().wasOpenedAtLogin || process.argv.includes("--startup")) && ((fs.readFileSync(path.join(process.resourcesPath, "autoLaunchType.txt"), "utf8") || "foreground") === "background")),
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false
    }
  });
  window.maximize();
  window.loadFile("pages/index.html");
  if (tray || (!app.getLoginItemSettings().wasOpenedAtLogin && !process.argv.includes("--startup")) || ((fs.readFileSync(path.join(process.resourcesPath, "autoLaunchType.txt"), "utf8") || "foreground") !== "background")) {
    window.show();
  } else {
    tray = new Tray(path.join(__dirname, "assets/favicon.ico"));
    tray.setToolTip("Remote Control");
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          window.show();
          window.setSkipTaskbar(false);
          tray.destroy();
          tray = null;
        }
      },
      {
        label: "Exit",
        click: () => {
          window.webContents.executeJavaScript("localStorage.getItem('settings');").then((settings) => {
            if (!(JSON.parse(settings) || {}).runInBackgroundOnClose) return (tray.destroy(), tray = null);
            app.quit();
          });
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
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
      }).then((returnValue) => {
        if (returnValue.response) return;
        autoUpdater.quitAndInstall();
      });
    });
  });

  ipcMain.on("openTerminal", (_, botId) => {
    if (ptyProcess) ptyProcess.kill();

    ptyProcess = require("@lydell/node-pty").spawn((require("os").platform() === "win32") ? "powershell.exe" : "bash", [], {
      name: "xterm-color",
      cols: 80,
      rows: Math.round(200 / 17),
      cwd: path.join(process.cwd(), "bots", botId.toString()),
      env: process.env
    });

    ptyProcess.on("data", (data) => {
      window.webContents.send("terminalData", data);
    });
  });

  ipcMain.on("terminalData", (_, data) => {
    ptyProcess.write(data);
  });

  ipcMain.handle("parseMarkdown", (_, markdown) => parse(markdown));
};

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});