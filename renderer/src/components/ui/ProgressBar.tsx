import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  size?: "default" | "large";
  onDark?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  size = "default",
  onDark = false,
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const classes = [
    styles.bar,
    size === "large" ? styles.large : null,
    onDark ? styles.onDark : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
    </div>
  );
}
