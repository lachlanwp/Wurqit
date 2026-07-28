import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type {
  ConsoleLogMessage,
  ExerciseVideo,
  FfmpegDebugInfo,
  GenerateWorkoutRequest,
  PersistedSettings,
  ProgressUpdate,
  Unsubscribe,
  WurqitAPI,
} from "./shared/ipc";

/**
 * Wraps an ipcRenderer channel in a subscribe/dispose pair. Returning a
 * disposer keeps ownership with the caller, so a React effect unmounting does
 * not silently kill another component's listener on the same channel.
 */
function subscribe<T>(
  channel: string,
  callback: (data: T) => void
): Unsubscribe {
  const listener = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const api: WurqitAPI = {
  getCategories: () => ipcRenderer.invoke("get-categories"),

  getEquipment: (categories: string[]) =>
    ipcRenderer.invoke("get-equipment", categories),

  getBodyGroups: (categories: string[], equipment: string[]) =>
    ipcRenderer.invoke("get-body-groups", categories, equipment),

  getAvailableVideos: (
    categories: string[],
    equipment: string[],
    bodyGroups?: string[]
  ): Promise<ExerciseVideo[]> =>
    ipcRenderer.invoke(
      "get-available-videos",
      categories,
      equipment,
      bodyGroups
    ),

  selectOutputFolder: () => ipcRenderer.invoke("select-output-folder"),

  generateWorkoutVideo: (request: GenerateWorkoutRequest) =>
    ipcRenderer.invoke("generate-workout-video", request),

  loadSettings: (): Promise<PersistedSettings | null> =>
    ipcRenderer.invoke("load-settings"),

  saveSettings: (settings: PersistedSettings) =>
    ipcRenderer.invoke("save-settings", settings),

  debugFfmpeg: (): Promise<FfmpegDebugInfo> =>
    ipcRenderer.invoke("debug-ffmpeg"),

  onGenerationProgress: (cb: (data: ProgressUpdate) => void) =>
    subscribe("generation-progress", cb),

  onConsoleLog: (cb: (data: ConsoleLogMessage) => void) =>
    subscribe("console-log", cb),

  onUpdateProgress: (cb: (data: ProgressUpdate) => void) =>
    subscribe("update-progress", cb),
};

contextBridge.exposeInMainWorld("api", api);
