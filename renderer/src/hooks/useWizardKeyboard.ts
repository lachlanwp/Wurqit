import { useEffect } from "react";
import { useWizardStore } from "@/stores/context";

/** Elements where arrow keys and space belong to the control, not the wizard. */
const INTERACTIVE = new Set(["INPUT", "SELECT", "TEXTAREA", "BUTTON"]);

/**
 * Arrow keys page through the wizard. The original build bound this to the
 * document unconditionally, which meant space-bar and arrows were swallowed
 * while a dropdown or checkbox had focus; interactive targets are skipped here.
 */
export function useWizardKeyboard(enabled: boolean) {
  const wizard = useWizardStore();

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target && (INTERACTIVE.has(target.tagName) || target.isContentEditable)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        wizard.goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        wizard.goBack();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [wizard, enabled]);
}
