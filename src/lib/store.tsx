import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppState } from "./types";
import { initialState } from "./mock-data";

const STORAGE_KEY = "drynuts.state.v1";

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
    if (raw) return JSON.parse(raw) as AppState;
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

  // Simulate production progress
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => {
        let changed = false;
        const tasks = s.tasks.map((task) => {
          if (task.status !== "running") return task;
          const next = Math.min(100, task.progress + Math.random() * 4 + 1);
          if (next !== task.progress) changed = true;
          if (next >= 100) {
            changed = true;
            return { ...task, progress: 100, status: "done" as const, finishedAt: new Date().toISOString() };
          }
          return { ...task, progress: next };
        });
        if (!changed) return s;

        // Post-process finished tasks: free workshop, add finished product, start next queued
        let workshops = s.workshops;
        let finished = s.finished;
        const tasksById = new Map(tasks.map((t) => [t.id, t]));

        for (const w of workshops) {
          if (!w.currentTaskId) continue;
          const t = tasksById.get(w.currentTaskId);
          if (t && t.status === "done") {
            // add finished stock
            const unitWeight = parseFloat(t.packSize) / (t.packSize.includes("kg") ? 1 : 1000);
            const kgToUnit = t.packSize.includes("kg") ? parseFloat(t.packSize) : parseFloat(t.packSize) / 1000;
            const units = Math.max(1, Math.floor(t.quantityKg / (kgToUnit || 0.25)));
            void unitWeight;
            finished = [
              ...finished,
              {
                id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                product: t.product,
                packSize: t.packSize,
                packType: t.packType,
                clientId: t.clientId,
                units,
                producedAt: new Date().toISOString(),
              },
            ];
            // find next queued task for this workshop
            const nextTask = tasks.find((x) => x.workshopId === w.id && x.status === "queued");
            workshops = workshops.map((ww) =>
              ww.id === w.id
                ? { ...ww, currentTaskId: nextTask?.id, status: nextTask ? ("running" as const) : ("idle" as const) }
                : ww,
            );
            if (nextTask) {
              const idx = tasks.findIndex((x) => x.id === nextTask.id);
              tasks[idx] = { ...nextTask, status: "running", startedAt: new Date().toISOString() };
            }
          }
        }

        return { ...s, tasks, workshops, finished };
      });
    }, 1500);
    return () => clearInterval(t);
  }, []);

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
