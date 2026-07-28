import { makeAutoObservable, runInAction } from "mobx";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const DISMISS_AFTER_MS = 3000;

/** Transient notifications, replacing the hand-rolled floating divs. */
export class ToastStore {
  toasts: Toast[] = [];

  private nextId = 1;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    makeAutoObservable<ToastStore, "nextId" | "timers">(this, {
      nextId: false,
      timers: false,
    });
  }

  show(message: string, type: ToastType = "info") {
    const id = this.nextId++;
    this.toasts = [...this.toasts, { id, message, type }];

    const timer = setTimeout(
      () => runInAction(() => this.dismiss(id)),
      DISMISS_AFTER_MS
    );
    this.timers.set(id, timer);
    return id;
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  dispose() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.toasts = [];
  }
}
