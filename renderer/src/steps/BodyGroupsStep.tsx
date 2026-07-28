import { observer } from "mobx-react-lite";
import { useWorkoutStore } from "@/stores/context";
import { StepLayout } from "@/components/wizard/StepLayout";
import { FormSection } from "@/components/ui/FormField";
import { CheckboxGrid } from "@/components/ui/CheckboxGrid";
import { AsyncSection } from "@/components/ui/AsyncSection";
import { ErrorText } from "@/components/ui/Feedback";

export const BodyGroupsStep = observer(function BodyGroupsStep() {
  const workout = useWorkoutStore();
  const { bodyGroups } = workout;
  const noEquipment = workout.equipment.selected.length === 0;

  return (
    <StepLayout step="body-groups">
      <FormSection>
        <AsyncSection
          loading={bodyGroups.loading}
          error={bodyGroups.error}
          isEmpty={bodyGroups.options.length === 0}
          loadingLabel="Loading body groups..."
          emptyLabel={
            noEquipment
              ? "Select equipment first to load body groups"
              : "No body groups available for the selected equipment — continue to pick exercises"
          }
        >
          <CheckboxGrid
            options={bodyGroups.options}
            isSelected={bodyGroups.isSelected}
            onChange={(value, checked) =>
              workout.setBodyGroupSelected(value, checked)
            }
          />
        </AsyncSection>
        <ErrorText>{workout.visibleError("body-groups")}</ErrorText>
      </FormSection>
    </StepLayout>
  );
});
