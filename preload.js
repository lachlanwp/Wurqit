const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Get categories from the videos directory
  getCategories: () => ipcRenderer.invoke("get-categories"),
  
  // Get equipment for selected categories
  getEquipment: (categories) => ipcRenderer.invoke("get-equipment", categories),
  

  
  // Select output folder
  selectOutputFolder: () => ipcRenderer.invoke("select-output-folder"),
  
  // Generate workout video
  generateWorkoutVideo: (formData) => ipcRenderer.invoke("generate-workout-video", formData),
  
  // Listen for generation progress updates
  onGenerationProgress: (callback) => {
    ipcRenderer.on('generation-progress', (event, data) => callback(data));
  },
  
  // Remove progress listener
  removeGenerationProgress: () => {
    ipcRenderer.removeAllListeners('generation-progress');
  },
  
  // Listen for console log messages
  onConsoleLog: (callback) => {
    ipcRenderer.on('console-log', (event, data) => callback(data));
  },
  
  // Remove console log listener
  removeConsoleLog: () => {
    ipcRenderer.removeAllListeners('console-log');
  },
  
  // Debug FFmpeg installation
  debugFfmpeg: () => ipcRenderer.invoke("debug-ffmpeg"),
  
  // Legacy ffmpeg function (keeping for compatibility)
  run: () => ipcRenderer.invoke("run-ffmpeg"),
});
