const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const {
  getCategories,
  getEquipment,
  generateWorkoutVideo,
  getFfmpegPath,
} = require("./generator");
const isDev = require("electron-is-dev");
const nativeImage = require("electron").nativeImage;

// Add crash prevention and memory management
app.commandLine.appendSwitch("--max-old-space-size", "4096");
app.commandLine.appendSwitch("--disable-gpu-sandbox");
app.commandLine.appendSwitch("--no-sandbox");

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'workout-settings.json');

// Function to load settings
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return null;
}

// Function to save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
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

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      enableRemoteModule: false,
      // Add memory management for renderer process
      backgroundThrottling: false,
    },
    icon: nativeImage.createFromPath(__dirname + "/media/icon/windows.png"),
    // Add crash prevention
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual glitches
  win.once("ready-to-show", () => {
    win.show();
  });

  // Handle window crashes
  win.webContents.on("crashed", (event, killed) => {
    console.error("Renderer process crashed:", { killed });
    // Reload the window instead of crashing the entire app
    win.reload();
  });

  win.loadFile("index.html");

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
                  createMainWindow(true);
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
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// Handle getting categories
ipcMain.handle("get-categories", async () => {
  try {
    return getCategories();
  } catch (error) {
    throw new Error(`Failed to get categories: ${error.message}`);
  }
});

// Handle getting equipment for selected categories
ipcMain.handle("get-equipment", async (event, categories) => {
  try {
    return getEquipment(categories);
  } catch (error) {
    throw new Error(`Failed to get equipment: ${error.message}`);
  }
});



// Handle folder selection dialog
ipcMain.handle("select-output-folder", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select folder to save workout video'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null; // User cancelled
  } catch (error) {
    throw new Error(`Failed to select folder: ${error.message}`);
  }
});

// Handle generating workout video
ipcMain.handle("generate-workout-video", async (event, formData) => {
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
    const progressCallback = (progress, message) => {
      event.sender.send("generation-progress", { progress, message });
    };

    // Create console callback function
    const consoleCallback = (level, message) => {
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
    throw new Error(`Failed to generate workout video: ${error.message}`);
  }
});

// Handle loading settings
ipcMain.handle("load-settings", async () => {
  try {
    return loadSettings();
  } catch (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }
});

// Handle saving settings
ipcMain.handle("save-settings", async (event, settings) => {
  try {
    const success = saveSettings(settings);
    if (!success) {
      throw new Error("Failed to save settings");
    }
    return true;
  } catch (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }
});

// Handle FFmpeg debugging
ipcMain.handle("debug-ffmpeg", async () => {
  try {
    const ffmpegPath = getFfmpegPath();
    const debugInfo = {
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
      const result = await new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpegPath, ["-version"]);
        let output = "";
        ffmpegProcess.stdout.on("data", (data) => (output += data));
        ffmpegProcess.stderr.on("data", (data) => (output += data));
        ffmpegProcess.on("close", (code) => {
          if (code === 0) {
            resolve(output.split("\n")[0]); // First line contains version info
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
        ffmpegProcess.on("error", (err) => reject(err));
      });
      debugInfo.version = result;
    } catch (error) {
      debugInfo.versionError = error.message;
    }

    return debugInfo;
  } catch (error) {
    throw new Error(`Failed to debug FFmpeg: ${error.message}`);
  }
});

// Example: Listen for FFmpeg command from renderer (legacy)
ipcMain.handle("run-ffmpeg", async () => {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFfmpegPath();
    const ffmpeg = spawn(ffmpegPath, [
      "-version", // change this to your desired command
    ]);

    let output = "";
    ffmpeg.stdout.on("data", (data) => (output += data));
    ffmpeg.stderr.on("data", (data) => (output += data));

    ffmpeg.on("close", (code) => {
      resolve(output);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
});

app.whenReady().then(createWindow);
