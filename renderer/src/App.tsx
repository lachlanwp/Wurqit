import { observer } from "mobx-react-lite";
import { Navigate, Route, Routes } from "react-router-dom";
import { useGenerationStore } from "@/stores/context";
import { useWizardKeyboard } from "@/hooks/useWizardKeyboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { WorkflowProgress } from "@/components/wizard/WorkflowProgress";
import { RouterBridge } from "@/components/wizard/RouterBridge";
import { GenerationPanel } from "@/components/generation/GenerationPanel";
import { UpdateOverlay } from "@/components/update/UpdateOverlay";
import { Toaster } from "@/components/ui/Toaster";
import { DurationStep } from "@/steps/DurationStep";
import { CategoriesStep } from "@/steps/CategoriesStep";
import { EquipmentStep } from "@/steps/EquipmentStep";
import { BodyGroupsStep } from "@/steps/BodyGroupsStep";
import { VideoSelectionStep } from "@/steps/VideoSelectionStep";
import { SummaryStep } from "@/steps/SummaryStep";
import { FIRST_STEP } from "@/stores/steps";
import styles from "./App.module.css";

export const App = observer(function App() {
  const generation = useGenerationStore();

  // While a video renders, the wizard is hidden and its shortcuts are inert.
  useWizardKeyboard(!generation.isBusy);

  return (
    <>
      <RouterBridge />
      <div className={styles.container}>
        <AppHeader />

        {generation.isBusy ? (
          <GenerationPanel />
        ) : (
          <>
            <WorkflowProgress />
            <Routes>
              <Route path="/duration" element={<DurationStep />} />
              <Route path="/categories" element={<CategoriesStep />} />
              <Route path="/equipment" element={<EquipmentStep />} />
              <Route path="/body-groups" element={<BodyGroupsStep />} />
              <Route path="/videos" element={<VideoSelectionStep />} />
              <Route path="/summary" element={<SummaryStep />} />
              <Route
                path="*"
                element={<Navigate to={FIRST_STEP.path} replace />}
              />
            </Routes>
          </>
        )}
      </div>

      <UpdateOverlay />
      <Toaster />
    </>
  );
});
