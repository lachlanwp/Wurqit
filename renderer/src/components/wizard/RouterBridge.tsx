import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWizardStore } from "@/stores/context";

/**
 * Keeps the router and the wizard store in step: the store learns the current
 * location, and gains the ability to drive it. Rendered once, inside the
 * router, so navigation logic can live in the store rather than in components.
 */
export function RouterBridge() {
  const wizard = useWizardStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    wizard.setNavigator((path) => navigate(path));
  }, [wizard, navigate]);

  useEffect(() => {
    wizard.syncLocation(location.pathname);
  }, [wizard, location.pathname]);

  return null;
}
