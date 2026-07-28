import { observer } from "mobx-react-lite";
import { useWorkoutStore } from "@/stores/context";
import { Button } from "@/components/ui/Button";
import styles from "./VideoSelection.module.css";

/** Counts plus the bulk select / deselect / randomise controls. */
export const VideoSelectionToolbar = observer(function VideoSelectionToolbar() {
  const workout = useWorkoutStore();
  const selectedCount = workout.selectedVideoPaths.length;
  const availableCount = workout.availableVideos.length;

  return (
    <div className={styles.toolbar}>
      <div className={styles.counts}>
        <span className={styles.count}>
          {selectedCount} out of {availableCount} selected
        </span>
        {workout.selectionTarget > 0 ? (
          <span className={styles.limit}>
            (Your workout has room for {workout.selectionTarget} exercise
            {workout.selectionTarget === 1 ? "" : "s"})
          </span>
        ) : null}
      </div>

      <div className={styles.controls}>
        <Button
          variant="secondary"
          disabled={availableCount === 0 || workout.selectionIsFull}
          onClick={() => workout.selectAll()}
        >
          Select All
        </Button>
        <Button
          variant="secondary"
          disabled={selectedCount === 0}
          onClick={() => workout.deselectAll()}
        >
          Deselect All
        </Button>
        <Button
          variant="secondary"
          disabled={availableCount === 0}
          onClick={() => workout.randomSelect()}
        >
          Random Select
        </Button>
      </div>
    </div>
  );
});
