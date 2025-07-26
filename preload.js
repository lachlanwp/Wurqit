const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Get categories from the videos directory
  getCategories: () => ipcRenderer.invoke("get-categories"),
  
  // Get equipment for selected categories
  getEquipment: (categories) => ipcRenderer.invoke("get-equipment", categories),
  
  // Get desktop path
  getDesktopPath: () => ipcRenderer.invoke("get-desktop-path"),
  
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
  
  // Legacy ffmpeg function (keeping for compatibility)
  run: () => ipcRenderer.invoke("run-ffmpeg"),
});
