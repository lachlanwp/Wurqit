import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: number;
  label: string;
}

interface NumberSelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "value" | "onChange" | "children"
  > {
  value: number | null;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: number | null) => void;
}

/** A select over numeric options, with an empty sentinel for "not chosen". */
export function NumberSelect({
  value,
  options,
  placeholder,
  onChange,
  ...rest
}: NumberSelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value === "" ? null : Number(event.target.value))
      }
      {...rest}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Builds an inclusive range of options, e.g. 20..120 step 5. */
export function rangeOptions(
  from: number,
  to: number,
  step: number,
  unit: (value: number) => string
): SelectOption[] {
  const options: SelectOption[] = [];
  for (let value = from; value <= to; value += step) {
    options.push({ value, label: unit(value) });
  }
  return options;
}
