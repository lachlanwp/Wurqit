import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import {
  useGenerationStore,
  useWizardStore,
  useWorkoutStore,
} from "@/stores/context";
import { StepLayout } from "@/components/wizard/StepLayout";
import { FormSection } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { OutputFolderPicker } from "@/components/output/OutputFolderPicker";
import { stepById } from "@/stores/steps";
import styles from "./SummaryStep.module.css";

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function joined(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None selected";
}

export const SummaryStep = observer(function SummaryStep() {
  const workout = useWorkoutStore();
  const wizard = useWizardStore();
  const generation = useGenerationStore();

  const generate = () =>
    void generation.start((step) => wizard.goTo(stepById(step)));

  return (
    <StepLayout
      step="summary"
      forwardAction={
        <Button variant="submit" onClick={generate}>
          🎬 Generate
        </Button>
      }
    >
      <FormSection>
        <div className={styles.summary}>
          <h3>Workout Summary</h3>
          <div className={styles.grid}>
            <SummaryCard title="⏱️ Duration Settings">
              <ul>
                <li>
                  <strong>Work Duration:</strong> {workout.workDuration ?? "—"}{" "}
                  seconds
                </li>
                <li>
                  <strong>Rest Duration:</strong> {workout.restDuration ?? "—"}{" "}
                  seconds
                </li>
                <li>
                  <strong>Sets per Station:</strong>{" "}
                  {workout.setsPerStation ?? "—"}
                </li>
                <li>
                  <strong>Station Rest:</strong> {workout.stationRest ?? "—"}{" "}
                  seconds
                </li>
                <li>
                  <strong>Total Duration:</strong>{" "}
                  {workout.totalWorkoutDuration ?? "—"} minutes
                </li>
              </ul>
            </SummaryCard>

            <SummaryCard title="📂 Exercise Categories">
              <p>
                <strong>Selected:</strong>{" "}
                {joined(workout.categories.selected)}
              </p>
            </SummaryCard>

            <SummaryCard title="🏋️ Equipment">
              <p>
                <strong>Selected:</strong> {joined(workout.equipment.selected)}
              </p>
            </SummaryCard>

            <SummaryCard title="🧍 Body Groups">
              <p>
                <strong>Selected:</strong> {joined(workout.bodyGroups.selected)}
              </p>
            </SummaryCard>

            <SummaryCard title="🎬 Exercise Videos">
              <p>
                <strong>Selected:</strong> {workout.selectedVideoPaths.length}{" "}
                video
                {workout.selectedVideoPaths.length === 1 ? "" : "s"}
              </p>
            </SummaryCard>
          </div>
        </div>
      </FormSection>

      <FormSection title="📁 Output Folder">
        <OutputFolderPicker />
      </FormSection>
    </StepLayout>
  );
});
