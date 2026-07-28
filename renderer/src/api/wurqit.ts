import { toJS } from "mobx";
import { MEDIA_SCHEME } from "@shared/ipc";
import type { WurqitAPI } from "@shared/ipc";

/**
 * The preload bridge. Accessed through this module rather than `window.api`
 * directly so the rest of the renderer has one place to stub in tests.
 */
export const api: WurqitAPI = window.api;

/**
 * Exercise clips live outside the app bundle, so they cannot be addressed with
 * a relative URL and `file://` is blocked once the renderer is served over
 * http:// by the dev server. The main process registers a custom scheme that
 * streams them instead.
 */
export function mediaUrl(absolutePath: string): string {
  // The path travels in the query string rather than the authority so that
  // Chromium's URL normalisation cannot lower-case it — file systems on Linux
  // and inside case-sensitive volumes care.
  return `${MEDIA_SCHEME}://local/?path=${encodeURIComponent(absolutePath)}`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * MobX wraps observable arrays in a Proxy, and the structured clone algorithm
 * behind `ipcRenderer.invoke` refuses to serialise a Proxy — the call rejects
 * with a DataCloneError. Anything derived from store state must be flattened
 * to plain values before it crosses the process boundary.
 */
export function plain<T>(value: T[]): T[] {
  return toJS(value);
}
