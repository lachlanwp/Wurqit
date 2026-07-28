import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useWizardStore } from "@/stores/context";
import { Button } from "@/components/ui/Button";
import { stepById, type StepId } from "@/stores/steps";
import styles from "./StepLayout.module.css";

interface StepLayoutProps {
  step: StepId;
  children: ReactNode;
  /** Replaces the default "Next" button, e.g. with the generate action. */
  forwardAction?: ReactNode;
}

/**
 * The shared frame every step renders inside: gradient header, body, and the
 * back/next footer. Keeping it in one place means a step component only has to
 * describe its own controls.
 */
export const StepLayout = observer(function StepLayout({
  step,
  children,
  forwardAction,
}: StepLayoutProps) {
  const wizard = useWizardStore();
  const definition = stepById(step);
  const previous = wizard.previousStep;
  const next = wizard.nextStep;

  return (
    <section className={styles.content}>
      <div className={styles.header}>
        <h2>
          {definition.icon} Step {definition.number}: {definition.heading}
        </h2>
        <p>{definition.description}</p>
      </div>

      {children}

      <div className={styles.navigation}>
        {previous ? (
          <Button variant="back" onClick={() => wizard.goBack()}>
            ← Back: {previous.heading}
          </Button>
        ) : null}

        {forwardAction ??
          (next ? (
            <Button variant="primary" onClick={() => wizard.goNext()}>
              Next: {next.heading} →
            </Button>
          ) : null)}
      </div>
    </section>
  );
});
