import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The renderer is served from a dev server during development and from
// `file://` inside the packaged app, so every asset URL has to be relative.
export default defineConfig(({ command }) => ({
  root: path.resolve(__dirname, "renderer"),
  base: "./",
  plugins: [react(), contentSecurityPolicy(command === "serve")],
  // Defaults to <root>/public. Only UI chrome lives there — the exercise media
  // library is shipped separately as an electron-builder extraResource.
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
    // Electron ships its own Chromium, so there is no need to down-level.
    target: "chrome120",
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "renderer/index.html"),
        // The splash window shares the app's assets, so it is built here
        // rather than kept as a standalone file with its own copies.
        splash: path.resolve(__dirname, "renderer/splash.html"),
      },
    },
  },
  server: {
    port: 5273,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Pinned to the .ts source on purpose. `tsc` also emits a CommonJS
      // `ipc.js` next to it for the main process, and Vite's default extension
      // order prefers .js — which resolves but exposes no named exports.
      "@shared/ipc": path.resolve(__dirname, "src/shared/ipc.ts"),
      "@": path.resolve(__dirname, "renderer/src"),
    },
  },
}));

/**
 * The dev server needs `unsafe-inline` styles and a websocket back to Vite for
 * HMR; the packaged app should not. Rather than keep two copies of index.html
 * in sync, the policy is injected at transform time.
 */
function contentSecurityPolicy(isDev: boolean) {
  const policy = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self'",
    isDev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    "img-src 'self' data: wurqit-media:",
    "media-src 'self' wurqit-media:",
    "font-src 'self'",
    isDev ? "connect-src 'self' ws://localhost:5273" : "connect-src 'self'",
  ].join("; ");

  return {
    name: "wurqit-csp",
    transformIndexHtml(html: string) {
      return html.replace("%CSP%", policy);
    },
  };
}
