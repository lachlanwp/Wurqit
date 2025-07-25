const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("renderer.html");
}

// Example: Listen for FFmpeg command from renderer
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
