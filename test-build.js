const { app, BrowserWindow } = require("electron");
const path = require("path");

// Add the same memory management flags as main.js
app.commandLine.appendSwitch("--max-old-space-size", "4096");
app.commandLine.appendSwitch("--disable-gpu-sandbox");
app.commandLine.appendSwitch("--no-sandbox");

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      enableRemoteModule: false,
      backgroundThrottling: false,
    },
    show: false,
  });

  win.once("ready-to-show", () => {
    console.log("Window ready to show - app should not crash");
    win.show();

    // Close after 3 seconds to test if it works
    setTimeout(() => {
      console.log("Test completed successfully");
      app.quit();
    }, 3000);
  });

  win.webContents.on("crashed", (event, killed) => {
    console.error("Renderer process crashed:", { killed });
    app.quit();
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  console.log("App is ready, creating window...");
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
