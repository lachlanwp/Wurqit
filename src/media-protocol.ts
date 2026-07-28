import { net, protocol } from "electron";
import path from "path";
import { pathToFileURL } from "url";
import { MEDIA_SCHEME } from "./shared/ipc";
import { getVideosDir } from "./generator";

/**
 * Exercise clips live outside the app bundle, so the renderer cannot reach them
 * with a relative URL — and `file://` is unavailable once the renderer is
 * served over http:// by the dev server. A custom scheme bridges the gap.
 *
 * Must be called before the `ready` event.
 */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        // Required for <video> seeking, which issues range requests.
        stream: true,
      },
    },
  ]);
}

/** Must be called after the `ready` event. */
export function handleMediaRequests(): void {
  const videosRoot = path.resolve(getVideosDir());

  protocol.handle(MEDIA_SCHEME, async (request) => {
    const requested = new URL(request.url).searchParams.get("path");
    if (!requested) {
      return new Response("Missing path", { status: 400 });
    }

    const resolved = path.resolve(requested);

    // The renderer only ever asks for exercise clips. Confining the handler to
    // the video library keeps a compromised renderer from reading arbitrary
    // files off disk through this channel.
    if (!isInside(videosRoot, resolved)) {
      return new Response("Forbidden", { status: 403 });
    }

    return net.fetch(pathToFileURL(resolved).toString());
  });
}

function isInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}
