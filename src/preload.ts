import { contextBridge, ipcRenderer } from "electron";

// Define the API interface for type safety
interface WurqitAPI {
  getCategories: () => Promise<string[]>;
  getEquipment: (categories: string[]) => Promise<string[]>;
  selectOutputFolder: () => Promise<string | null>;
  generateWorkoutVideo: (formData: any) => Promise<string>;
  onGenerationProgress: (
    callback: (data: { progress: number; message: string }) => void
  ) => void;
  removeGenerationProgress: () => void;
  onConsoleLog: (
    callback: (data: { level: string; message: string }) => void
  ) => void;
  removeConsoleLog: () => void;
  loadSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;
  debugFfmpeg: () => Promise<any>;
  run: () => Promise<string>;
  onUpdateProgress: (
    callback: (data: { progress: number; message: string }) => void
  ) => void;
  removeUpdateProgress: () => void;
}

contextBridge.exposeInMainWorld("api", {
  // Get categories from the videos directory
  getCategories: () => ipcRenderer.invoke("get-categories"),

  // Get equipment for selected categories
  getEquipment: (categories: string[]) =>
    ipcRenderer.invoke("get-equipment", categories),

  // Select output folder
  selectOutputFolder: () => ipcRenderer.invoke("select-output-folder"),

  // Generate workout video
  generateWorkoutVideo: (formData: any) =>
    ipcRenderer.invoke("generate-workout-video", formData),

  // Listen for generation progress updates
  onGenerationProgress: (
    callback: (data: { progress: number; message: string }) => void
  ) => {
    ipcRenderer.on("generation-progress", (event, data) => callback(data));
  },

  // Remove progress listener
  removeGenerationProgress: () => {
    ipcRenderer.removeAllListeners("generation-progress");
  },

  // Listen for console log messages
  onConsoleLog: (
    callback: (data: { level: string; message: string }) => void
  ) => {
    ipcRenderer.on("console-log", (event, data) => callback(data));
  },

  // Remove console log listener
  removeConsoleLog: () => {
    ipcRenderer.removeAllListeners("console-log");
  },

  // Load saved settings
  loadSettings: () => ipcRenderer.invoke("load-settings"),

  // Save settings
  saveSettings: (settings: any) =>
    ipcRenderer.invoke("save-settings", settings),

  // Debug FFmpeg installation
  debugFfmpeg: () => ipcRenderer.invoke("debug-ffmpeg"),

  // Legacy ffmpeg function (keeping for compatibility)
  run: () => ipcRenderer.invoke("run-ffmpeg"),

  // Listen for update progress updates
  onUpdateProgress: (
    callback: (data: { progress: number; message: string }) => void
  ) => {
    ipcRenderer.on("update-progress", (event, data) => callback(data));
  },

  // Remove update progress listener
  removeUpdateProgress: () => {
    ipcRenderer.removeAllListeners("update-progress");
  },
} as WurqitAPI);

// Extend the global Window interface to include our API
declare global {
  interface Window {
    api: WurqitAPI;
  }
}
