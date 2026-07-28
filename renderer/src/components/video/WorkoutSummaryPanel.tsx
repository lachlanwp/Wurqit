import { observer } from "mobx-react-lite";
import { useToastStore, useWorkoutStore } from "@/stores/context";
import { SelectedVideoThumb } from "./SelectedVideoThumb";
import styles from "./WorkoutSummary.module.css";

function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * The live picture of the selected workout: a one-line breakdown plus a
 * gallery where individual exercises can be dropped or swapped.
 */
export const WorkoutSummaryPanel = observer(function WorkoutSummaryPanel() {
  const workout = useWorkoutStore();
  const toasts = useToastStore();
  const selected = workout.selectedVideos;

  const categories = unique(selected.map((video) => video.category));
  const equipment = unique(selected.map((video) => video.equipment));
  const bodyGroups = unique(
    selected
      .map((video) => video.bodyGroup)
      .filter((group): group is string => Boolean(group))
  );

  return (
    <div className={styles.panel}>
      <h4>Selected Workout Summary</h4>
      <div className={styles.body}>
        {selected.length === 0 ? (
          "No videos selected"
        ) : (
          <>
            <p>
              {selected.length} {plural(selected.length, "exercise")}
              {categories.length > 0
                ? ` · ${categories.length} ${plural(categories.length, "category", "categories")}: ${categories.join(", ")}`
                : ""}
              {equipment.length > 0
                ? ` · ${equipment.length} ${plural(equipment.length, "equipment type")}: ${equipment.join(", ")}`
                : ""}
              {bodyGroups.length > 0
                ? ` · ${bodyGroups.length} ${plural(bodyGroups.length, "body group")}: ${bodyGroups.join(", ")}`
                : ""}
            </p>
            <p>
              <strong>Exercises:</strong>{" "}
              {selected.map((video) => video.exerciseName).join(", ")}
            </p>

            <div className={styles.gallery}>
              {selected.map((video) => (
                <SelectedVideoThumb
                  key={video.path}
                  video={video}
                  onRemove={() => workout.setVideoSelected(video.path, false)}
                  onSwap={() => {
                    if (!workout.swapVideo(video.path)) {
                      toasts.show(
                        "No alternative exercise available to swap",
                        "warning"
                      );
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
