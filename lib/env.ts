/**
 * Centralized environment variable reader.
 *
 * Keep ALL process.env access in this file so we can:
 *  - validate at startup,
 *  - expose typed helpers,
 *  - swap mock <-> external simulation API cleanly.
 */

function readOptionalString(key: string): string | null {
  const raw = process.env[key];
  if (!raw || raw.trim() === "") return null;
  return raw.trim();
}

function readOptionalNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  /** External 3D simulation engine REST base URL (e.g. https://sim.example.com). */
  simulationApiUrl: readOptionalString("SIMULATION_API_URL"),

  /** Bearer token for simulation API (optional). */
  simulationApiToken: readOptionalString("SIMULATION_API_TOKEN"),

  /** Request timeout for external simulation calls, in ms. */
  simulationApiTimeoutMs: readOptionalNumber("SIMULATION_API_TIMEOUT_MS", 5000),
} as const;

export function isExternalSimulation(): boolean {
  return env.simulationApiUrl !== null;
}

export function simulationSource(): "mock" | "external" {
  return isExternalSimulation() ? "external" : "mock";
}
