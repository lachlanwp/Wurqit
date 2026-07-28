import { createContext, useContext, type ReactNode } from "react";
import { RootStore } from "./RootStore";

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({
  store,
  children,
}: {
  store: RootStore;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useStores(): RootStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStores must be used within a StoreProvider");
  }
  return store;
}

export const useWorkoutStore = () => useStores().workout;
export const useWizardStore = () => useStores().wizard;
export const useGenerationStore = () => useStores().generation;
export const useToastStore = () => useStores().toasts;
export const useUpdateStore = () => useStores().update;
