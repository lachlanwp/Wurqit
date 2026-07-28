import { makeAutoObservable, runInAction } from "mobx";
import type { Unsubscribe } from "@shared/ipc";
import { api } from "@/api/wurqit";

const HIDE_AFTER_COMPLETE_MS = 2000;

/** Backs the modal shown while an app update downloads in the background. */
export class UpdateStore {
  visible = false;
  progress = 0;
  message = "Starting download...";

  private unsubscribe: Unsubscribe | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable<UpdateStore, "unsubscribe" | "hideTimer">(this, {
      unsubscribe: false,
      hideTimer: false,
    });
  }

  listen() {
    this.unsubscribe?.();
    this.unsubscribe = api.onUpdateProgress(({ progress, message }) => {
      runInAction(() => {
        if (progress === 0) this.visible = true;
        this.progress = progress;
        this.message = message;
      });

      if (progress === 100) {
        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(
          () => runInAction(() => (this.visible = false)),
          HIDE_AFTER_COMPLETE_MS
        );
      }
    });
  }

  dispose() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }
}
