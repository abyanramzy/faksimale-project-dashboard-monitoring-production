import { create } from "zustand";
import {
  ProductionOverview,
  Lane,
  AIRecommendation,
  CommandLogEntry,
  AlarmEntry,
  SafetySettings,
} from "./types";
import {
  mockAlarms,
  mockCommandLog,
  mockLanes,
  mockProductionOverview,
  mockSafetySettings,
} from "./mock-data";

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

  updateOverview: (updates: Partial<ProductionOverview>) => void;
  updateLanes: (lanes: Lane[]) => void;
  setCommandLog: (entries: CommandLogEntry[]) => void;
  addCommandLog: (entry: CommandLogEntry) => void;
  setAlarms: (entries: AlarmEntry[]) => void;
  setPendingRecommendation: (rec: AIRecommendation | null) => void;
  setPreviousTargetBpm: (bpm: number | null) => void;
  setSimulationState: (running: boolean, elapsed?: number, bottles?: number) => void;
  updateSafetySettings: (settings: SafetySettings) => void;
  resolveAlarm: (alarmId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
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

  updateOverview: (updates) =>
    set((state) => ({ overview: { ...state.overview, ...updates } })),

  updateLanes: (lanes) => set({ lanes }),

  setCommandLog: (entries) => set({ commandLog: entries }),

  addCommandLog: (entry) =>
    set((state) => ({
      commandLog: [{ ...entry, id: entry.id ?? `cmd-${Date.now()}` }, ...state.commandLog].slice(0, 80),
    })),

  setAlarms: (entries) => set({ alarms: entries }),

  setPendingRecommendation: (rec) => set({ pendingRecommendation: rec }),

  setPreviousTargetBpm: (bpm) => set({ previousTargetBpm: bpm }),

  setSimulationState: (running, elapsed, bottles) =>
    set((state) => ({
      simRunning: running,
      simElapsed: elapsed ?? state.simElapsed,
      simBottles: bottles ?? state.simBottles,
    })),

  updateSafetySettings: (settings) => set({ safetySettings: settings }),

  resolveAlarm: (alarmId) =>
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, active: false } : alarm
      ),
    })),
}));
