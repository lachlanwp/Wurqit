import { observer } from "mobx-react-lite";
import { useUpdateStore } from "@/stores/context";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./UpdateOverlay.module.css";

/** Blocking modal shown while a new app version downloads. */
export const UpdateOverlay = observer(function UpdateOverlay() {
  const update = useUpdateStore();

  if (!update.visible) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3>🔄 Downloading Update</h3>
        <div className={styles.content}>
          <div className={styles.percentage}>{update.progress}%</div>
          <ProgressBar
            value={update.progress}
            size="large"
            label="Update download progress"
          />
          <div className={styles.message}>{update.message}</div>
        </div>
      </div>
    </div>
  );
});
