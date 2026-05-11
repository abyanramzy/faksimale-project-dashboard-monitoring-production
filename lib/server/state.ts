/**
 * Server-side in-memory state store.
 *
 * WHY this exists:
 *  - Next.js API route handlers are stateless by default. When the client mutates
 *    data (resolve alarm, save safety, start simulation), we need that change to
 *    survive subsequent GET requests within the same server process.
 *  - This also creates ONE single source of truth that is trivial to swap for a
 *    real database or external simulation API call later — the route handlers
 *    only talk to this module, not to mock-data directly.
 *
 * Scope & limits:
 *  - State lives in the Node.js process memory. It resets on server restart.
 *  - Safe for single-node dev and demos. For multi-instance production, replace
 *    each getter/setter with a DB or cache adapter without touching route code.
 *  - Not safe against race conditions; route handlers should treat writes as
 *    last-write-wins.
 */

import {
  mockAlarms,
  mockCommandLog,
  mockHardwareAdvisor,
  mockLanes,
  mockProductionOverview,
  mockSafetySettings,
  mockScenarios,
  mockSimulationBridge,
} from "@/lib/mock-data";
import { simulationTuning } from "@/lib/thresholds";
import type {
  AlarmEntry,
  CommandLogEntry,
  HardwareAdvisor,
  Lane,
  ProductionOverview,
  SafetySettings,
  Scenario,
  SimulationAction,
  SimulationBridgeState,
} from "@/lib/types";

interface ServerState {
  overview: ProductionOverview;
  lanes: Lane[];
  alarms: AlarmEntry[];
  commandLog: CommandLogEntry[];
  safety: SafetySettings;
  scenarios: Scenario[];
  hardwareAdvisor: HardwareAdvisor;
  simulation: SimulationBridgeState;
  /** Wall-clock timestamp (ms) of the last simulation transition. */
  simulationLastTickAt: number;
}

// ---------------------------------------------------------------------------
// Module-level singleton. In Next.js dev mode the module can be re-evaluated on
// HMR; we guard against that by hanging state off globalThis.
// ---------------------------------------------------------------------------
const GLOBAL_KEY = "__faksimale_server_state__";
type GlobalWithState = typeof globalThis & { [GLOBAL_KEY]?: ServerState };

function bootstrap(): ServerState {
  return {
    overview: { ...mockProductionOverview },
    lanes: mockLanes.map((lane) => ({ ...lane })),
    alarms: mockAlarms.map((alarm) => ({ ...alarm })),
    commandLog: mockCommandLog.map((entry) => ({ ...entry })),
    safety: { ...mockSafetySettings },
    scenarios: mockScenarios.map((scenario) => ({ ...scenario })),
    hardwareAdvisor: { ...mockHardwareAdvisor },
    simulation: { ...mockSimulationBridge },
    simulationLastTickAt: Date.now(),
  };
}

function getState(): ServerState {
  const g = globalThis as GlobalWithState;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = bootstrap();
  }
  return g[GLOBAL_KEY]!;
}

// ---------------------------------------------------------------------------
// Overview & lanes — these are "live" signals and drift on every read to
// simulate a running line. We mutate in place so subsequent reads stay
// continuous rather than snapping back to the literal mock constants.
// ---------------------------------------------------------------------------

export function readOverview(): ProductionOverview {
  const state = getState();
  const drift = (Math.random() - 0.45) * 1.8;
  const actualBpm = Number((state.overview.actualBpm + drift * 0.4).toFixed(1));

  state.overview = {
    ...state.overview,
    actualBpm: clamp(actualBpm, 80, state.overview.targetBpm + 8),
    totalInput: state.overview.totalInput + Math.round(actualBpm * 0.05),
    totalOutput: state.overview.totalOutput + Math.round(actualBpm * 0.048),
  };

  return { ...state.overview };
}

export function patchOverview(patch: Partial<ProductionOverview>): ProductionOverview {
  const state = getState();
  state.overview = { ...state.overview, ...patch };
  return { ...state.overview };
}

export function readLanes(): Lane[] {
  const state = getState();
  state.lanes = state.lanes.map((lane) => {
    const bpmDrift = (Math.random() - 0.5) * 1.2;
    const utilDrift = Math.round((Math.random() - 0.45) * 3);
    const utilization = clamp(lane.utilization + utilDrift, 0, 100);
    const status: Lane["status"] =
      utilization >= 94 ? "Jam" : utilization >= 88 ? "Warning" : "Normal";

    return {
      ...lane,
      bpm: Number((lane.bpm + bpmDrift).toFixed(1)),
      utilization,
      status,
      hasJam: utilization >= 94,
    };
  });

  return state.lanes.map((lane) => ({ ...lane }));
}

// ---------------------------------------------------------------------------
// Alarms
// ---------------------------------------------------------------------------

export function readAlarms(): AlarmEntry[] {
  return getState().alarms.map((alarm) => ({ ...alarm }));
}

export function resolveAlarm(alarmId: string): AlarmEntry | null {
  const state = getState();
  const target = state.alarms.find((alarm) => alarm.id === alarmId);
  if (!target) return null;
  target.active = false;
  return { ...target };
}

// ---------------------------------------------------------------------------
// Command log
// ---------------------------------------------------------------------------

const COMMAND_LOG_LIMIT = 120;

export function readCommandLog(): CommandLogEntry[] {
  return getState().commandLog.map((entry) => ({ ...entry }));
}

export function appendCommandLog(entry: CommandLogEntry): CommandLogEntry {
  const state = getState();
  const withId: CommandLogEntry = {
    ...entry,
    id: entry.id ?? `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  state.commandLog = [withId, ...state.commandLog].slice(0, COMMAND_LOG_LIMIT);
  return { ...withId };
}

// ---------------------------------------------------------------------------
// Safety settings
// ---------------------------------------------------------------------------

export function readSafety(): SafetySettings {
  return { ...getState().safety };
}

export function writeSafety(next: SafetySettings): SafetySettings {
  const state = getState();
  state.safety = { ...next };
  return { ...state.safety };
}

// ---------------------------------------------------------------------------
// Scenarios & hardware advisor (read-only mocks for now)
// ---------------------------------------------------------------------------

export function readScenarios(): Scenario[] {
  return getState().scenarios.map((scenario) => ({ ...scenario }));
}

export function readHardwareAdvisor(): HardwareAdvisor {
  return { ...getState().hardwareAdvisor };
}

// ---------------------------------------------------------------------------
// Simulation bridge — with wall-clock tick so elapsed/bottles actually grow
// while the simulation is "Running" between client polls.
// ---------------------------------------------------------------------------

function tickSimulation(): void {
  const state = getState();
  const now = Date.now();
  const deltaSec = Math.max(0, (now - state.simulationLastTickAt) / 1000);
  state.simulationLastTickAt = now;

  if (state.simulation.status !== "Running") return;

  const nextElapsed = Math.min(
    state.simulation.elapsedSeconds + deltaSec,
    simulationTuning.maxElapsedSeconds
  );
  const nextBottles =
    state.simulation.bottleCount + Math.floor(deltaSec * simulationTuning.bottlesPerSecond);

  state.simulation = {
    ...state.simulation,
    elapsedSeconds: Math.round(nextElapsed),
    bottleCount: nextBottles,
  };
}

export function readSimulation(): SimulationBridgeState {
  tickSimulation();
  return { ...getState().simulation };
}

export function applySimulationAction(action: SimulationAction): SimulationBridgeState {
  tickSimulation();
  const state = getState();

  switch (action) {
    case "start":
      state.simulation = {
        ...state.simulation,
        status: "Running",
        lastAction: "start",
        message:
          "Simulasi berjalan. Counter elapsed dan bottleCount akan bertambah otomatis selama Running.",
      };
      break;
    case "pause":
      state.simulation = {
        ...state.simulation,
        status: "Paused",
        lastAction: "pause",
        message: "Simulasi dijeda. State terakhir dipertahankan untuk analisis.",
      };
      break;
    case "reset":
      state.simulation = {
        ...state.simulation,
        status: "Idle",
        elapsedSeconds: 0,
        bottleCount: 0,
        lastAction: "reset",
        message: "State simulasi direset. Tekan Start untuk memulai ulang.",
      };
      break;
  }

  return { ...state.simulation };
}

// ---------------------------------------------------------------------------
// Test & dev helpers
// ---------------------------------------------------------------------------

/**
 * Testing/debug helper — resets server state to the mock baseline. Do NOT call
 * from production code paths.
 */
export function resetStateForTesting(): void {
  const g = globalThis as GlobalWithState;
  g[GLOBAL_KEY] = bootstrap();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
