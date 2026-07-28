import { makeAutoObservable, runInAction } from "mobx";
import type { Unsubscribe } from "@shared/ipc";
import { api, errorMessage } from "@/api/wurqit";
import type { WorkoutStore } from "./WorkoutStore";
import type { ToastStore } from "./ToastStore";
import type { StepId } from "./steps";

export type GenerationStatus = "idle" | "running" | "succeeded" | "failed";

/** Drives video generation and the progress view that replaces the wizard. */
export class GenerationStore {
  status: GenerationStatus = "idle";
  progress = 0;
  message = "";
  log: string[] = [];
  outputFile: string | null = null;

  private disposers: Unsubscribe[] = [];

  constructor(
    private readonly workout: WorkoutStore,
    private readonly toasts: ToastStore
  ) {
    makeAutoObservable<GenerationStore, "workout" | "toasts" | "disposers">(
      this,
      { workout: false, toasts: false, disposers: false }
    );
  }

  get isRunning(): boolean {
    return this.status === "running";
  }

  /**
   * True while the progress view should replace the wizard entirely. A failed
   * run stays on screen too, so the error and the ffmpeg log remain readable
   * until the user dismisses them.
   */
  get isBusy(): boolean {
    return this.status !== "idle";
  }

  private appendLog(line: string) {
    this.log = [...this.log, line];
  }

  /**
   * Validates every step, then runs generation. Errors from any step are
   * surfaced as a toast and the user is sent back to the offending step.
   */
  async start(onValidationFailure?: (step: StepId) => void) {
    const invalid = firstInvalid(this.workout);
    if (invalid) {
      this.workout.markTouched(invalid);
      this.toasts.show(this.workout.validationError(invalid)!, "warning");
      onValidationFailure?.(invalid);
      return;
    }

    const request = this.workout.generateRequest;
    if (!request) return;

    runInAction(() => {
      this.status = "running";
      this.progress = 0;
      this.message = "Initializing...";
      this.log = [];
      this.outputFile = null;
    });

    this.disposers.push(
      api.onGenerationProgress(({ progress, message }) => {
        runInAction(() => {
          this.progress = progress;
          this.message = message;
          this.appendLog(`[${progress}%] ${message}`);
          // The first real progress tick is a natural moment to confirm where
          // the finished file will land.
          if (progress === 5) {
            this.appendLog(`📁 Output will be saved to: ${request.outputPath}`);
          }
        });
        document.title = `WURQIT - ${progress}% - ${message}`;
      })
    );

    this.disposers.push(
      api.onConsoleLog(({ level, message }) => {
        const logger =
          level === "error"
            ? console.error
            : level === "warn"
              ? console.warn
              : console.log;
        logger(`[${level.toUpperCase()}] ${message}`);
      })
    );

    try {
      const outputFile = await api.generateWorkoutVideo(request);
      runInAction(() => {
        this.status = "succeeded";
        this.outputFile = outputFile;
        this.appendLog(
          `✅ Workout video generated successfully!\nOutput file: ${outputFile}`
        );
      });
      this.toasts.show("Workout video generated successfully", "success");
    } catch (error) {
      runInAction(() => {
        this.status = "failed";
        this.appendLog(`❌ Error: ${errorMessage(error)}`);
      });
      this.toasts.show(`Generation failed: ${errorMessage(error)}`, "error");
    } finally {
      document.title = "WURQIT";
      this.cleanUpListeners();
    }
  }

  /** Returns the wizard to view after a run; the log stays available. */
  acknowledge() {
    this.status = "idle";
    this.progress = 0;
    this.message = "";
  }

  private cleanUpListeners() {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
  }

  dispose() {
    this.cleanUpListeners();
  }
}

/** The first step that fails validation, in wizard order. */
function firstInvalid(workout: WorkoutStore) {
  const order = [
    "duration",
    "categories",
    "equipment",
    "body-groups",
    "videos",
    "summary",
  ] as const;
  return order.find((step) => !workout.isValid(step)) ?? null;
}
