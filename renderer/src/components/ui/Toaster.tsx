import { observer } from "mobx-react-lite";
import { useToastStore } from "@/stores/context";
import styles from "./Toaster.module.css";

/** Renders the transient notification stack. Click a toast to dismiss it early. */
export const Toaster = observer(function Toaster() {
  const toasts = useToastStore();

  if (toasts.toasts.length === 0) return null;

  return (
    <div className={styles.host} aria-live="polite">
      {toasts.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => toasts.dismiss(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
});
