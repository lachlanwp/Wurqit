import { observer } from "mobx-react-lite";
import { useWorkoutStore } from "@/stores/context";
import { StepLayout } from "@/components/wizard/StepLayout";
import { FormSection } from "@/components/ui/FormField";
import { CheckboxGrid } from "@/components/ui/CheckboxGrid";
import { AsyncSection } from "@/components/ui/AsyncSection";
import { ErrorText } from "@/components/ui/Feedback";

export const CategoriesStep = observer(function CategoriesStep() {
  const workout = useWorkoutStore();
  const { categories } = workout;

  return (
    <StepLayout step="categories">
      <FormSection>
        <AsyncSection
          loading={categories.loading}
          error={categories.error}
          isEmpty={categories.options.length === 0}
          loadingLabel="Loading categories..."
          emptyLabel="No exercise categories found in the video library"
        >
          <CheckboxGrid
            options={categories.options}
            isSelected={categories.isSelected}
            onChange={(value, checked) =>
              workout.setCategorySelected(value, checked)
            }
          />
        </AsyncSection>
        <ErrorText>{workout.visibleError("categories")}</ErrorText>
      </FormSection>
    </StepLayout>
  );
});
