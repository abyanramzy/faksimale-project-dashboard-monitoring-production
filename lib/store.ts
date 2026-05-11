import { create } from "zustand";
import {
  mockAlarms,
  mockCommandLog,
  mockLanes,
  mockProductionOverview,
  mockSafetySettings,
} from "./mock-data";
import type {
  AIRecommendation,
  AlarmEntry,
  CommandLogEntry,
  Lane,
  ProductionOverview,
  SafetySettings,
} from "./types";

/**
 * Client state store.
 *
 * Design notes:
 *  - We seed with mock-data ONLY so first paint has something to show. The
 *    server is the source of truth; client updates are applied optimistically
 *    and reconciled via the /api/tick polling loop.
 *  - `hydrated` flag lets components know when server data has arrived for
 *    the first time (so we can hide "initial mock" labels).
 *  - CommandLog is append-only from the client; we never call setCommandLog
 *    with the full server list anymore because that used to clobber optimistic
 *    entries the user had just seen.
 */

export interface Toast {
  id: string;
  kind: "success" | "error" | "info";
  message: string;
}

interface AppState {
  overview: ProductionOverview;
  lanes: Lane[];
  commandLog: CommandLogEntry[];
  alarms: AlarmEntry[];
  safetySettings: SafetySettings;
  pendingRecommendation: AIRecommendation | null;
  previousTargetBpm: number | null;
  simRunning: boolean;
  simElapsed: number;
  simBottles: number;
  hydrated: boolean;
  toasts: Toast[];

  // ---- setters that align with what the server returns (replace full state)
  setOverview: (next: ProductionOverview) => void;
  patchOverview: (updates: Partial<ProductionOverview>) => void;
  setLanes: (lanes: Lane[]) => void;
  setAlarms: (alarms: AlarmEntry[]) => void;
  setSafetySettings: (settings: SafetySettings) => void;

  // ---- command log is local + append-only
  addCommandLog: (entry: CommandLogEntry) => void;
  /** Seed the command log ONCE on first load (no-op afterwards). */
  seedCommandLog: (entries: CommandLogEntry[]) => void;

  // ---- alarm optimistic update
  markAlarmResolved: (alarmId: string) => void;

  // ---- AI recommendation flow
  setPendingRecommendation: (rec: AIRecommendation | null) => void;
  setPreviousTargetBpm: (bpm: number | null) => void;

  // ---- simulation
  setSimulationState: (running: boolean, elapsed: number, bottles: number) => void;

  // ---- hydration / toasts
  setHydrated: () => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  overview: { ...mockProductionOverview },
  lanes: mockLanes.map((lane) => ({ ...lane })),
  commandLog: mockCommandLog.map((entry) => ({ ...entry })),
  alarms: mockAlarms.map((alarm) => ({ ...alarm })),
  safetySettings: { ...mockSafetySettings },
  pendingRecommendation: null,
  previousTargetBpm: null,
  simRunning: false,
  simElapsed: 0,
  simBottles: 0,
  hydrated: false,
  toasts: [],

  setOverview: (next) => set({ overview: next }),
  patchOverview: (updates) =>
    set((state) => ({ overview: { ...state.overview, ...updates } })),

  setLanes: (lanes) => set({ lanes }),
  setAlarms: (alarms) => set({ alarms }),
  setSafetySettings: (settings) => set({ safetySettings: settings }),

  addCommandLog: (entry) =>
    set((state) => ({
      commandLog: [
        { ...entry, id: entry.id ?? `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
        ...state.commandLog,
      ].slice(0, 120),
    })),

  seedCommandLog: (entries) => {
    // Only seed if we have exactly the mock-data baseline. After any user
    // action the log diverges from mock and must not be overwritten.
    const current = get().commandLog;
    const isBaseline =
      current.length <= mockCommandLog.length &&
      current.every((entry, index) => entry.id === mockCommandLog[index]?.id);
    if (isBaseline) set({ commandLog: entries });
  },

  markAlarmResolved: (alarmId) =>
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, active: false } : alarm
      ),
    })),

  setPendingRecommendation: (rec) => set({ pendingRecommendation: rec }),
  setPreviousTargetBpm: (bpm) => set({ previousTargetBpm: bpm }),

  setSimulationState: (running, elapsed, bottles) =>
    set({ simRunning: running, simElapsed: elapsed, simBottles: bottles }),

  setHydrated: () => set({ hydrated: true }),

  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ].slice(-4),
    })),

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
