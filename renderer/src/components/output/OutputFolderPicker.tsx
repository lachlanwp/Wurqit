import { observer } from "mobx-react-lite";
import { useId } from "react";
import { useWorkoutStore } from "@/stores/context";
import { ErrorText } from "@/components/ui/Feedback";
import styles from "./OutputFolderPicker.module.css";

/** Read-only path display plus the native folder chooser. */
export const OutputFolderPicker = observer(function OutputFolderPicker({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const workout = useWorkoutStore();
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId}>Save video to:</label>
      <div className={styles.container}>
        <input
          id={inputId}
          type="text"
          className={styles.input}
          readOnly
          value={workout.outputPath ?? ""}
          placeholder="Click 'Choose Folder' to select where to save the video"
        />
        <button
          type="button"
          className={styles.button}
          disabled={disabled}
          onClick={() => void workout.chooseOutputFolder()}
        >
          📂 Choose Folder
        </button>
      </div>
      <ErrorText>
        {workout.outputPathError ?? workout.visibleError("summary")}
      </ErrorText>
      <small className={styles.help}>
        Please select a folder to save your workout video
      </small>
    </div>
  );
});
