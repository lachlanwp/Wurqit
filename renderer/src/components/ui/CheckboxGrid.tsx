import { useId } from "react";
import styles from "./CheckboxGrid.module.css";

interface CheckboxGridProps {
  options: string[];
  isSelected: (value: string) => boolean;
  onChange: (value: string, checked: boolean) => void;
  disabled?: boolean;
}

/** The responsive grid of labelled checkboxes used by the filter steps. */
export function CheckboxGrid({
  options,
  isSelected,
  onChange,
  disabled = false,
}: CheckboxGridProps) {
  const prefix = useId();

  return (
    <div className={styles.grid}>
      {options.map((option) => {
        const id = `${prefix}-${option}`;
        return (
          <div key={option} className={styles.item}>
            <input
              type="checkbox"
              id={id}
              value={option}
              checked={isSelected(option)}
              disabled={disabled}
              onChange={(event) => onChange(option, event.target.checked)}
            />
            <label htmlFor={id}>{option}</label>
          </div>
        );
      })}
    </div>
  );
}
