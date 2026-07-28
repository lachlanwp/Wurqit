import type { ExerciseVideo } from "@shared/ipc";
import { VideoPreview } from "./VideoPreview";
import styles from "./WorkoutSummary.module.css";

interface SelectedVideoThumbProps {
  video: ExerciseVideo;
  onRemove: () => void;
  onSwap: () => void;
}

/** A chosen exercise in the summary gallery, with remove and swap actions. */
export function SelectedVideoThumb({
  video,
  onRemove,
  onSwap,
}: SelectedVideoThumbProps) {
  return (
    <div className={styles.thumb}>
      <div className={styles.frame}>
        <VideoPreview
          path={video.path}
          className={styles.frameVideo}
          placeholderClassName={styles.framePlaceholder}
          alwaysPlaying
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          title="Swap this exercise"
          aria-label={`Swap ${video.exerciseName} for another exercise`}
          onClick={onSwap}
        >
          ↻
        </button>
        <button
          type="button"
          className={`${styles.action} ${styles.remove}`}
          title="Remove this exercise"
          aria-label={`Remove ${video.exerciseName}`}
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <div className={styles.caption}>{video.exerciseName}</div>
    </div>
  );
}
