"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Engine, type JournalInput } from "./engine";

const STORAGE_KEY = "vyomrix-engine-v1";
const MAX_AGE_SECONDS = 4 * 3600;

let engine: Engine | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let paused = false;
const pauseListeners = new Set<() => void>();

function load(): { startSec: number; journal?: Engine["journal"] } {
  const now = Math.floor(Date.now() / 1000);
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved.startSec === "number" && Array.isArray(saved.journal) && now - saved.startSec < MAX_AGE_SECONDS) return saved;
  } catch {
    // Storage can be unavailable in private modes; the engine still works in memory.
  }
  return { startSec: now - Engine.historySeconds };
}

function persist() {
  if (!engine) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ startSec: engine.startSec, journal: engine.journal }));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function getEngine(): Engine {
  if (engine) return engine;
  const saved = load();
  engine = new Engine({ startSec: saved.startSec, journal: saved.journal, nowSec: Math.floor(Date.now() / 1000) });
  persist();
  if (!timer) {
    timer = setInterval(() => {
      if (!paused && engine) engine.advanceTo(Math.floor(Date.now() / 1000));
    }, 1000);
  }
  return engine;
}

const subscribe = (fn: () => void) => getEngine().subscribe(fn);
const snapshot = () => getEngine().version;

/** Returns the live engine on the client, or null during server rendering. Re-renders every engine tick. */
export function useEngine(): Engine | null {
  const version = useSyncExternalStore(subscribe, snapshot, () => 0);
  return version === 0 ? null : getEngine();
}

export function useEngineVersion() {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}

export const ANALYST = "You (recruiter session)";

/** Records an analyst decision, persists the journal and shows a toast. */
export function act(entry: JournalInput, message?: string) {
  const e = getEngine();
  e.record(entry);
  persist();
  if (message) toast.success(message);
}

export function launchScenario(id: string) {
  const e = getEngine();
  const run = e.launch(id);
  persist();
  toast.message(`${run.name} launched`, { description: `${run.id} from ${run.attacker}. Steps start in two seconds.` });
  return run;
}

export function resetLab() {
  try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  window.location.reload();
}

export function setPaused(value: boolean) {
  paused = value;
  if (!value && engine) engine.advanceTo(Math.floor(Date.now() / 1000));
  for (const fn of pauseListeners) fn();
}

export function usePaused() {
  return useSyncExternalStore((fn) => { pauseListeners.add(fn); return () => { pauseListeners.delete(fn); }; }, () => paused, () => false);
}
