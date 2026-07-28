import { useId, type ReactNode } from "react";
import { ErrorText } from "./Feedback";
import styles from "./FormField.module.css";

interface FormFieldProps {
  label: string;
  error?: string | null;
  /** Receives the generated id so the control stays associated with its label. */
  children: (id: string) => ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  disabled?: boolean;
  children: ReactNode;
}

/** The bordered panel that groups a step's controls. */
export function FormSection({ title, disabled, children }: FormSectionProps) {
  const classes = [styles.section, disabled ? styles.sectionDisabled : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}
