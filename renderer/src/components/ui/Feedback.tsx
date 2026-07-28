import type { ReactNode } from "react";
import styles from "./Feedback.module.css";

/** Inline validation or failure text. Renders nothing when there is no message. */
export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className={styles.error} role="alert">
      {children}
    </div>
  );
}

export function Loading({ children }: { children: ReactNode }) {
  return (
    <div className={styles.loading} role="status">
      {children}
    </div>
  );
}

/** A neutral "nothing to show yet" placeholder — distinct from an error. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}
