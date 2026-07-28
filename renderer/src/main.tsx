import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { configure } from "mobx";
import { App } from "./App";
import { RootStore } from "./stores/RootStore";
import { StoreProvider } from "./stores/context";
import "./styles/global.css";

configure({
  // Surface accidental mutations outside actions during development.
  enforceActions: "observed",
  computedRequiresReaction: false,
  disableErrorBoundaries: false,
});

// The app has no browser-style context menu to offer.
document.addEventListener("contextmenu", (event) => event.preventDefault());

const store = new RootStore();
void store.initialise();

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing from index.html");

// HashRouter, not BrowserRouter: the packaged app is served from file://,
// where path-based history entries cannot be resolved.
createRoot(container).render(
  <StrictMode>
    <StoreProvider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </StoreProvider>
  </StrictMode>
);
