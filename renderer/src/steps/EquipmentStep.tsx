import { observer } from "mobx-react-lite";
import { useWorkoutStore } from "@/stores/context";
import { StepLayout } from "@/components/wizard/StepLayout";
import { FormSection } from "@/components/ui/FormField";
import { CheckboxGrid } from "@/components/ui/CheckboxGrid";
import { AsyncSection } from "@/components/ui/AsyncSection";
import { ErrorText } from "@/components/ui/Feedback";

export const EquipmentStep = observer(function EquipmentStep() {
  const workout = useWorkoutStore();
  const { equipment } = workout;
  const noCategories = workout.categories.selected.length === 0;

  return (
    <StepLayout step="equipment">
      <FormSection>
        <AsyncSection
          loading={equipment.loading}
          error={equipment.error}
          isEmpty={equipment.options.length === 0}
          loadingLabel="Loading equipment..."
          emptyLabel={
            noCategories
              ? "Select categories first to load equipment"
              : "No equipment found for the selected categories"
          }
        >
          <CheckboxGrid
            options={equipment.options}
            isSelected={equipment.isSelected}
            onChange={(value, checked) =>
              workout.setEquipmentSelected(value, checked)
            }
          />
        </AsyncSection>
        <ErrorText>{workout.visibleError("equipment")}</ErrorText>
      </FormSection>
    </StepLayout>
  );
});
