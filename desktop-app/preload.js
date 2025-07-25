const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ffmpeg", {
  run: () => ipcRenderer.invoke("run-ffmpeg"),
});
