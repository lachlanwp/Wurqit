import { useId } from "react";
import type { ExerciseVideo } from "@shared/ipc";
import { VideoPreview } from "./VideoPreview";
import styles from "./VideoCard.module.css";

interface VideoCardProps {
  video: ExerciseVideo;
  selected: boolean;
  onToggle: () => void;
}

/** One selectable exercise in the video picker grid. */
export function VideoCard({ video, selected, onToggle }: VideoCardProps) {
  const checkboxId = useId();

  return (
    <div className={styles.card}>
      <input
        type="checkbox"
        id={checkboxId}
        className={styles.checkbox}
        checked={selected}
        onChange={onToggle}
        aria-label={`Select ${video.exerciseName}`}
      />

      <VideoPreview
        path={video.path}
        className={styles.preview}
        placeholderClassName={styles.placeholder}
        onClick={onToggle}
      />

      <div className={styles.info}>
        <label htmlFor={checkboxId} className={styles.name}>
          {video.exerciseName}
        </label>
        <div className={styles.meta}>
          <span className={`${styles.tag} ${styles.category}`}>
            {video.category}
          </span>
          <span className={`${styles.tag} ${styles.equipment}`}>
            {video.equipment}
          </span>
          {video.bodyGroup ? (
            <span className={`${styles.tag} ${styles.bodyGroup}`}>
              {video.bodyGroup}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
