import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { useGenerationStore, useWizardStore } from "@/stores/context";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import styles from "./GenerationPanel.module.css";

/** Replaces the wizard while a video is being rendered. */
export const GenerationPanel = observer(function GenerationPanel() {
  const generation = useGenerationStore();
  const wizard = useWizardStore();
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest ffmpeg output in view.
  useEffect(() => {
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [generation.log.length]);

  return (
    <div>
      <div className={styles.panel}>
        <div className={styles.percentage}>{generation.progress}%</div>
        <ProgressBar
          value={generation.progress}
          onDark
          label="Video generation progress"
        />
        <div className={styles.message}>{generation.message}</div>
      </div>

      {generation.log.length > 0 ? (
        <div className={styles.log} ref={logRef}>
          {generation.log.join("\n")}
        </div>
      ) : null}

      {generation.isRunning ? null : (
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => {
              generation.acknowledge();
              wizard.goToSummary();
            }}
          >
            Back to Summary
          </Button>
        </div>
      )}
    </div>
  );
});
