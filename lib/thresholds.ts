/**
 * Single source of truth for production thresholds, guardrails, and tuning knobs.
 * If you find a "magic number" anywhere in the app, it probably belongs here.
 */

export const laneThresholds = {
  /** utilization >= warn -> status "Warning" */
  warnUtilization: 88,
  /** utilization >= jam  -> status "Jam" */
  jamUtilization: 94,
} as const;

export const overviewThresholds = {
  /** |actualBpm - targetBpm| <= bpmDeltaOk -> tone "good" */
  bpmDeltaOk: 2,
  /** yield >= yieldGood -> tone "good" */
  yieldGood: 99.5,
  /** jamCount > jamWarn -> tone "danger" */
  jamWarn: 2,
  /** downtime <= downtimeGood -> tone "good" */
  downtimeGoodMinutes: 5,
} as const;

export const aiAnalyzeThresholds = {
  /** utilization triggering AI "reduce load" recommendation */
  highUtilization: 92,
  /** avg utilization under which AI may recommend increasing target */
  safeAvgUtilization: 88,
  /** jam events triggering reduce-load recommendation */
  jamThreshold: 1,
  /** reject count over which AI holds instead of increasing target */
  rejectHold: 20,
  /** bpm step when AI recommends target change */
  bpmStep: 5,
  /** minimum target bpm the AI will ever recommend */
  minTargetBpm: 80,
} as const;

export const simulationTuning = {
  /** bottles produced per real second while running (mock only) */
  bottlesPerSecond: 2,
  /** cap on mock elapsed seconds to prevent runaway counters */
  maxElapsedSeconds: 60 * 60 * 8,
} as const;

export const pollingIntervals = {
  /** unified dashboard tick interval (ms). One snapshot for overview + lanes. */
  tickMs: 3000,
  /** longer interval for non-timeseries panels (alarms, scenarios, safety) */
  slowMs: 15000,
} as const;

export const trendChart = {
  /** keep last N points in the BPM trend chart */
  historySize: 20,
  /** y-axis padding around min/max (in BPM) */
  axisPadding: 5,
} as const;
