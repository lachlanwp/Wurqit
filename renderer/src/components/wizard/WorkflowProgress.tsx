import { observer } from "mobx-react-lite";
import { useWizardStore } from "@/stores/context";
import styles from "./WorkflowProgress.module.css";

/** The clickable step indicator across the top of the wizard. */
export const WorkflowProgress = observer(function WorkflowProgress() {
  const wizard = useWizardStore();

  return (
    <nav className={styles.progress} aria-label="Workout setup progress">
      {wizard.steps.map((step) => {
        const isActive = step.id === wizard.currentStepId;
        const hasError = wizard.hasError(step);
        const isComplete = wizard.isComplete(step);
        const reachable = wizard.canVisit(step);

        const classes = [
          styles.step,
          isActive ? styles.active : null,
          isComplete ? styles.completed : null,
          hasError ? styles.error : null,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={step.id}
            type="button"
            className={classes}
            disabled={!reachable}
            aria-current={isActive ? "step" : undefined}
            onClick={() => wizard.goTo(step)}
          >
            <span className={styles.number}>{step.number}</span>
            <span className={styles.label}>{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
