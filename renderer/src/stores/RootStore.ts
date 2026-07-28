import { makeAutoObservable, reaction, runInAction, toJS } from "mobx";
import { api, errorMessage } from "@/api/wurqit";
import { WorkoutStore } from "./WorkoutStore";
import { WizardStore } from "./WizardStore";
import { GenerationStore } from "./GenerationStore";
import { UpdateStore } from "./UpdateStore";
import { ToastStore } from "./ToastStore";

/** Debounce so dragging through a dropdown does not write the file per keypress. */
const PERSIST_DEBOUNCE_MS = 400;

export class RootStore {
  readonly toasts = new ToastStore();
  readonly workout = new WorkoutStore();
  readonly wizard: WizardStore;
  readonly generation: GenerationStore;
  readonly update = new UpdateStore();

  /** False until saved settings have been applied, so the persistence
   *  reaction cannot overwrite a saved config with the empty initial state. */
  hydrated = false;

  private disposers: Array<() => void> = [];

  constructor() {
    this.wizard = new WizardStore(this.workout, this.toasts);
    this.generation = new GenerationStore(this.workout, this.toasts);

    makeAutoObservable<RootStore, "disposers">(this, {
      toasts: false,
      workout: false,
      wizard: false,
      generation: false,
      update: false,
      disposers: false,
    });
  }

  async initialise() {
    this.update.listen();

    let settings = null;
    try {
      settings = await api.loadSettings();
    } catch (error) {
      // A missing or unreadable settings file is not worth interrupting the
      // user over; they simply start from a blank configuration.
      console.warn("Could not load saved settings:", errorMessage(error));
    }

    try {
      if (settings) {
        await this.workout.hydrate(settings);
      } else {
        await this.workout.loadCategories();
      }
    } finally {
      // Persistence starts even if hydration failed part-way; otherwise a
      // single bad settings file would silently disable saving for the session.
      runInAction(() => {
        this.hydrated = true;
      });
      this.startPersisting();
    }
  }

  /**
   * Mirrors the configuration to disk whenever it changes. Replaces the old
   * "save on submit plus a chain of setTimeouts on load" approach, so a crash
   * or quit mid-configuration no longer loses the user's choices.
   */
  private startPersisting() {
    this.disposers.push(
      reaction(
        () => toJS(this.workout.snapshot),
        (snapshot) => {
          if (!this.hydrated) return;
          void api.saveSettings(snapshot).catch((error) => {
            console.warn("Could not save settings:", errorMessage(error));
          });
        },
        { delay: PERSIST_DEBOUNCE_MS }
      )
    );
  }

  dispose() {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
    this.generation.dispose();
    this.update.dispose();
    this.toasts.dispose();
  }
}
