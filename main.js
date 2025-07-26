const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const {
  getCategories,
  getEquipment,
  getDesktopPath,
  generateWorkoutVideo,
} = require("./generator");
const isDev = require("electron-is-dev");
const nativeImage = require("electron").nativeImage;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: nativeImage.createFromPath(__dirname + "/media/icon/icon.png"),
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
            await shell.openExternal("https://www.dronesurveyor.xyz/");
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

// Handle getting desktop path
ipcMain.handle("get-desktop-path", async () => {
  try {
    return getDesktopPath();
  } catch (error) {
    throw new Error(`Failed to get desktop path: ${error.message}`);
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
    } = formData;

    // Create progress callback function
    const progressCallback = (progress, message) => {
      event.sender.send("generation-progress", { progress, message });
    };

    return await generateWorkoutVideo(
      workDuration,
      restDuration,
      setsPerStation,
      stationRest,
      totalWorkoutDuration,
      categories,
      equipment,
      progressCallback
    );
  } catch (error) {
    throw new Error(`Failed to generate workout video: ${error.message}`);
  }
});

// Example: Listen for FFmpeg command from renderer (legacy)
ipcMain.handle("run-ffmpeg", async () => {
  return new Promise((resolve, reject) => {
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
