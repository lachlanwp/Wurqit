import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  nativeImage,
} from "electron";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import {
  getCategories,
  getEquipment,
  generateWorkoutVideo,
  getFfmpegPath,
} from "./generator";
import { checkForUpdates, setMainWindow } from "./update";
import isDev from "electron-is-dev";
import * as remoteElectron from "@electron/remote/main";
let mainWindow;

remoteElectron.initialize();

// Add crash prevention and memory management
app.commandLine.appendSwitch("--max-old-space-size", "4096");
app.commandLine.appendSwitch("--disable-gpu-sandbox");
app.commandLine.appendSwitch("--no-sandbox");

// Settings file path
const settingsPath = path.join(
  app.getPath("userData"),
  "workout-settings.json"
);

// Function to load settings
function loadSettings(): any {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return null;
}

// Function to save settings
function saveSettings(settings: any): boolean {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit immediately, let the app handle it gracefully
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit immediately, let the app handle it gracefully
});

function setupMenus() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        ...(isMac
          ? [
              { role: "close" },
              {
                label: "New Window",
                click: async () => {
                  createWindow();
                },
              },
            ]
          : [{ role: "quit" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Check for Updates",
          click: async () => {
            try {
              await checkForUpdates();
            } catch (error) {
              console.error('Manual update check failed:', error);
            }
          },
        },
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://wurqit.com/");
          },
        },
      ],
    },
  ];
  if (!isDev) {
    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }
}

function createMainWindow(andShow: boolean = false): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      // Add memory management for renderer process
      backgroundThrottling: false,
    },
    icon: nativeImage.createFromPath(__dirname + "/media/icon/windows.png"),
    // Add crash prevention
    show: false, // Don't show until ready
  });

  // Set the main window reference for the update module
  setMainWindow(mainWindow);

  // Handle window crashes
  mainWindow.webContents.on("crashed", (event, killed) => {
    console.error("Renderer process crashed:", { killed });
    // Reload the window instead of crashing the entire app
    mainWindow.reload();
  });

  setupMenus();

  mainWindow.loadFile("index.html");

  if (andShow) {
    mainWindow.show();
  }
}

function createWindow() {
  createMainWindow();

  var splash = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
  });

  remoteElectron.enable(splash.webContents);

  splash.loadFile("splash.html");

  // if main window is ready to show, then destroy the splash window and show up the main window
  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      splash.close();
      mainWindow.show();
      
      // Check for updates after a short delay to not interfere with app startup
      setTimeout(() => {
        checkForUpdates().catch(error => {
          console.error('Update check failed:', error);
        });
      }, 1000);
    }, 5000);
  });

  setupMenus();
}

// Handle getting categories
ipcMain.handle("get-categories", async () => {
  try {
    return getCategories();
  } catch (error) {
    throw new Error(`Failed to get categories: ${(error as Error).message}`);
  }
});

// Handle getting equipment for selected categories
ipcMain.handle("get-equipment", async (event, categories: string[]) => {
  try {
    return getEquipment(categories);
  } catch (error) {
    throw new Error(`Failed to get equipment: ${(error as Error).message}`);
  }
});

// Handle folder selection dialog
ipcMain.handle("select-output-folder", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select folder to save workout video",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null; // User cancelled
  } catch (error) {
    throw new Error(`Failed to select folder: ${(error as Error).message}`);
  }
});

// Handle generating workout video
ipcMain.handle("generate-workout-video", async (event, formData: any) => {
  try {
    const {
      workDuration,
      restDuration,
      setsPerStation,
      stationRest,
      totalWorkoutDuration,
      categories,
      equipment,
      outputPath,
    } = formData;

    // Create progress callback function
    const progressCallback = (progress: number, message: string) => {
      event.sender.send("generation-progress", { progress, message });
    };

    // Create console callback function
    const consoleCallback = (level: string, message: string) => {
      event.sender.send("console-log", { level, message });
    };

    return await generateWorkoutVideo(
      workDuration,
      restDuration,
      setsPerStation,
      stationRest,
      totalWorkoutDuration,
      categories,
      equipment,
      outputPath,
      progressCallback,
      consoleCallback
    );
  } catch (error) {
    throw new Error(
      `Failed to generate workout video: ${(error as Error).message}`
    );
  }
});

// Handle loading settings
ipcMain.handle("load-settings", async () => {
  try {
    return loadSettings();
  } catch (error) {
    throw new Error(`Failed to load settings: ${(error as Error).message}`);
  }
});

// Handle saving settings
ipcMain.handle("save-settings", async (event, settings: any) => {
  try {
    const success = saveSettings(settings);
    if (!success) {
      throw new Error("Failed to save settings");
    }
    return true;
  } catch (error) {
    throw new Error(`Failed to save settings: ${(error as Error).message}`);
  }
});

// Handle FFmpeg debugging
ipcMain.handle("debug-ffmpeg", async () => {
  try {
    const ffmpegPath = getFfmpegPath();
    const debugInfo: any = {
      ffmpegPath: ffmpegPath,
      exists: require("fs").existsSync(ffmpegPath),
      resourcesPath: process.resourcesPath,
      currentDir: __dirname,
      isDev: isDev,
      platform: require("os").platform(),
      arch: require("os").arch(),
    };

    // Try to run FFmpeg version command
    try {
      const { spawn } = require("child_process");
      const result = await new Promise<string>((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpegPath, ["-version"]);
        let output = "";
        ffmpegProcess.stdout.on("data", (data: Buffer) => (output += data));
        ffmpegProcess.stderr.on("data", (data: Buffer) => (output += data));
        ffmpegProcess.on("close", (code: number) => {
          if (code === 0) {
            resolve(output.split("\n")[0]); // First line contains version info
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
        ffmpegProcess.on("error", (err: Error) => reject(err));
      });
      debugInfo.version = result;
    } catch (error) {
      debugInfo.versionError = (error as Error).message;
    }

    return debugInfo;
  } catch (error) {
    throw new Error(`Failed to debug FFmpeg: ${(error as Error).message}`);
  }
});

// Example: Listen for FFmpeg command from renderer (legacy)
ipcMain.handle("run-ffmpeg", async () => {
  return new Promise<string>((resolve, reject) => {
    const ffmpegPath = getFfmpegPath();
    const ffmpeg = spawn(ffmpegPath, [
      "-version", // change this to your desired command
    ]);

    let output = "";
    ffmpeg.stdout.on("data", (data: Buffer) => (output += data));
    ffmpeg.stderr.on("data", (data: Buffer) => (output += data));

    ffmpeg.on("close", (code: number) => {
      resolve(output);
    });

    ffmpeg.on("error", (err: Error) => {
      reject(err);
    });
  });
});

app.whenReady().then(createWindow);
