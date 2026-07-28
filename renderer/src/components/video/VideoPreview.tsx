import { useRef, useState } from "react";
import { mediaUrl } from "@/api/wurqit";

interface VideoPreviewProps {
  path: string;
  className?: string;
  placeholderClassName?: string;
  /** Loops continuously instead of only while hovered. */
  alwaysPlaying?: boolean;
  onClick?: () => void;
}

/**
 * A muted looping clip. Plays on hover by default so a grid of previews does
 * not decode dozens of videos at once.
 */
export function VideoPreview({
  path,
  className,
  placeholderClassName,
  alwaysPlaying = false,
  onClick,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={placeholderClassName}
        onClick={onClick}
        title="Preview unavailable"
      >
        🎬
      </div>
    );
  }

  const play = () => {
    // Autoplay can reject if the element is detached mid-gesture; there is
    // nothing useful to do about it.
    void videoRef.current?.play().catch(() => {});
  };

  return (
    <video
      ref={videoRef}
      className={className}
      src={mediaUrl(path)}
      muted
      loop
      playsInline
      controls={false}
      autoPlay={alwaysPlaying}
      preload="metadata"
      onClick={onClick}
      onCanPlay={alwaysPlaying ? play : undefined}
      onMouseEnter={alwaysPlaying ? undefined : play}
      onMouseLeave={
        alwaysPlaying
          ? undefined
          : () => {
              const video = videoRef.current;
              if (!video) return;
              video.pause();
              video.currentTime = 0;
            }
      }
      onError={() => setFailed(true)}
    />
  );
}
