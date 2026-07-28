/**
 * The contract between the Electron main process and the React renderer.
 *
 * Both sides compile this file — main via `tsc`, the renderer via Vite — so the
 * channel names and payload shapes can only drift if they drift in both places
 * at once.
 */

/** Custom scheme used to stream exercise clips from outside the app bundle. */
export const MEDIA_SCHEME = "wurqit-media";

export interface ExerciseVideo {
  path: string;
  category: string;
  equipment: string;
  bodyGroup?: string;
  exerciseName: string;
  filename: string;
}

export interface WorkoutTimings {
  workDuration: number;
  restDuration: number;
  setsPerStation: number;
  stationRest: number;
  totalWorkoutDuration: number;
}

export interface GenerateWorkoutRequest extends WorkoutTimings {
  categories: string[];
  equipment: string[];
  bodyGroups: string[];
  selectedVideos: string[];
  outputPath: string;
}

/** Everything the app restores on next launch. Fields are nullable because a
 *  settings file may predate any given option. */
export interface PersistedSettings {
  workDuration: number | null;
  restDuration: number | null;
  setsPerStation: number | null;
  stationRest: number | null;
  totalWorkoutDuration: number | null;
  categories: string[];
  equipment: string[];
  bodyGroups: string[];
  selectedVideos: string[];
  outputPath: string | null;
  timestamp: string;
}

export interface ProgressUpdate {
  progress: number;
  message: string;
}

export type LogLevel = "info" | "warn" | "error";

export interface ConsoleLogMessage {
  level: LogLevel;
  message: string;
}

export interface FfmpegDebugInfo {
  ffmpegPath: string;
  exists: boolean;
  resourcesPath: string;
  currentDir: string;
  isDev: boolean;
  platform: string;
  arch: string;
  version?: string;
  versionError?: string;
}

/** Listener registrations return their own disposer so React effects can clean
 *  up a single subscription instead of tearing down every listener on a
 *  channel, which is what the old `removeAllListeners` approach did. */
export type Unsubscribe = () => void;

export interface WurqitAPI {
  getCategories(): Promise<string[]>;
  getEquipment(categories: string[]): Promise<string[]>;
  getBodyGroups(categories: string[], equipment: string[]): Promise<string[]>;
  getAvailableVideos(
    categories: string[],
    equipment: string[],
    bodyGroups?: string[]
  ): Promise<ExerciseVideo[]>;
  selectOutputFolder(): Promise<string | null>;
  generateWorkoutVideo(request: GenerateWorkoutRequest): Promise<string>;
  loadSettings(): Promise<PersistedSettings | null>;
  saveSettings(settings: PersistedSettings): Promise<boolean>;
  debugFfmpeg(): Promise<FfmpegDebugInfo>;
  onGenerationProgress(cb: (data: ProgressUpdate) => void): Unsubscribe;
  onConsoleLog(cb: (data: ConsoleLogMessage) => void): Unsubscribe;
  onUpdateProgress(cb: (data: ProgressUpdate) => void): Unsubscribe;
}

declare global {
  interface Window {
    api: WurqitAPI;
  }
}
