import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppState } from "./types";
import { initialState } from "./mock-data";

const STORAGE_KEY = "drynuts.state.v2";

type Updater = (s: AppState) => AppState;

interface StoreCtx {
  state: AppState;
  update: (u: Updater) => void;
  reset: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

function loadInitial(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      // merge with defaults so newly added modules/settings always exist
      return {
        ...initialState,
        ...parsed,
        customerService: {
          ...initialState.customerService,
          ...(parsed.customerService ?? {}),
        },
        settings: { ...initialState.settings, ...(parsed.settings ?? {}) },
      } as AppState;
    }
  } catch {
    /* ignore */
  }
  return initialState;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Note: production progress is now driven manually via the "Terminer" button
  // in the Ateliers page — no time-based simulation.

  return (
    <Ctx.Provider
      value={{
        state,
        update: (u) => setState((s) => u(s)),
        reset: () => setState(initialState),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
