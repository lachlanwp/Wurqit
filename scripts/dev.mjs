/**
 * Development launcher: boots the Vite dev server, then starts Electron
 * pointed at it. Electron's lifetime governs the script's, so quitting the app
 * shuts the server down too.
 */
import { spawn } from "node:child_process";
import { createServer } from "vite";
import electron from "electron";

const server = await createServer({ configFile: "vite.config.ts" });
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) {
  await server.close();
  throw new Error("Vite dev server started without a local URL");
}

server.printUrls();

const child = spawn(electron, ["."], {
  stdio: "inherit",
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
});

child.on("close", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
