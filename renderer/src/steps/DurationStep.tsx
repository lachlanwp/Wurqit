import { observer } from "mobx-react-lite";
import { useWorkoutStore } from "@/stores/context";
import { StepLayout } from "@/components/wizard/StepLayout";
import { FormField, FormSection } from "@/components/ui/FormField";
import {
  NumberSelect,
  rangeOptions,
  type SelectOption,
} from "@/components/ui/Select";
import type { TimingKey } from "@/stores/WorkoutStore";

const seconds = (value: number) => `${value} seconds`;
const minutes = (value: number) => `${value} minutes`;
const sets = (value: number) => `${value} sets`;

interface TimingField {
  key: TimingKey;
  label: string;
  placeholder: string;
  options: SelectOption[];
}

const TIMING_FIELDS: TimingField[] = [
  {
    key: "workDuration",
    label: "Work Duration:",
    placeholder: "Select work duration",
    options: rangeOptions(20, 120, 5, seconds),
  },
  {
    key: "restDuration",
    label: "Rest Duration:",
    placeholder: "Select rest duration",
    options: rangeOptions(5, 60, 5, seconds),
  },
  {
    key: "setsPerStation",
    label: "Number of Sets:",
    placeholder: "Select number of sets",
    options: rangeOptions(2, 6, 1, sets),
  },
  {
    key: "stationRest",
    label: "Station Rest:",
    placeholder: "Select station rest",
    options: rangeOptions(5, 40, 5, seconds),
  },
  {
    key: "totalWorkoutDuration",
    label: "Total Workout Duration:",
    placeholder: "Select total workout duration",
    options: rangeOptions(10, 120, 5, minutes),
  },
];

export const DurationStep = observer(function DurationStep() {
  const workout = useWorkoutStore();

  return (
    <StepLayout step="duration">
      <FormSection>
        {TIMING_FIELDS.map((field) => (
          <FormField
            key={field.key}
            label={field.label}
            error={workout.timingError(field.key)}
          >
            {(id) => (
              <NumberSelect
                id={id}
                value={workout[field.key]}
                options={field.options}
                placeholder={field.placeholder}
                onChange={(value) => workout.setTiming(field.key, value)}
              />
            )}
          </FormField>
        ))}

        {workout.timingsComplete ? (
          <p>
            Each exercise station takes {workout.secondsPerStation} seconds,
            leaving room for <strong>{workout.videoSlots}</strong> exercises.
          </p>
        ) : null}
      </FormSection>
    </StepLayout>
  );
});
