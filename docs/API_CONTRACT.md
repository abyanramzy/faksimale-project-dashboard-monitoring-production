# Faksimale Dashboard — API Contract

This document is the handoff spec between the dashboard (Next.js) and the
3D simulation engine that will eventually replace the mock endpoints.

All internal routes follow the same envelope:

```jsonc
// Success
{
  "data": <T>,
  "meta": {
    "source": "mock" | "external",
    "generatedAt": "2026-05-11T08:00:00.000Z",
    "simulationEndpoint": "https://sim.example.com" // or null
  }
}

// Failure
{
  "error": { "message": "string", "details": <unknown> },
  "meta": { ... }
}
```

The client helper `apiClient.get/post` in `lib/api-client.ts` unwraps this
envelope automatically and throws an `Error` with the server-provided
message on non-2xx responses.

---

## Polling Strategy

The dashboard uses **one** high-frequency poll (`/api/tick`, every
`pollingIntervals.tickMs = 3000ms`) for the live BPM/lane/alarm view. The
other endpoints are either one-shot (scenarios, hardware, safety) or
action-triggered (simulation, command log).

| Endpoint                    | Frequency         | Consumer                    |
|-----------------------------|-------------------|-----------------------------|
| `GET /api/tick`             | 3s poll           | OverviewPanel, LineMonitor  |
| `GET /api/simulation`       | 3s poll           | SimulationControl           |
| `GET /api/safety`           | once on mount     | SafetyBoundarySettings      |
| `GET /api/scenarios`        | once on mount     | ScenarioComparisonTable     |
| `GET /api/hardware`         | once on mount     | HardwareAdvisorPanel        |
| `GET /api/command-log`      | once on mount     | CommandLogTable             |
| `POST /api/ai/analyze`      | user-triggered    | AIAgentPanel                |
| `POST /api/overview`        | user-triggered    | AIAgentPanel (Apply/Mode)   |
| `POST /api/alarms/{id}/resolve` | user-triggered | AlarmDowntimePanel          |
| `POST /api/safety`          | user-triggered    | SafetyBoundarySettings      |
| `POST /api/simulation`      | user-triggered    | SimulationControl           |
| `POST /api/command-log`     | optional          | any client-side event logger|

---

## Endpoints

### GET `/api/tick`

Consolidated snapshot used by the live dashboard. Returns overview + all
lanes + all alarms assembled from one internal read, so values reconcile
(e.g. `sum(lanes[].bpm)` tracks `overview.actualBpm`).

```ts
type DashboardSnapshot = {
  overview: ProductionOverview;
  lanes: Lane[];
  alarms: AlarmEntry[];
  serverTime: string; // ISO
};
```

### GET / POST `/api/overview`

`GET` returns current `ProductionOverview`. `POST` accepts a **partial**
patch — only `targetBpm` and `aiMode` are writable from the client to
protect live metrics from being overwritten.

```ts
// POST body
{ targetBpm?: number; aiMode?: ProductionOverview["aiMode"] }
```

Validation:
- `targetBpm`: number in `[50, 200]`
- `aiMode`: one of `"Monitor" | "Advisor" | "Assisted Control" | "Closed Loop" | "Exploration"`

On success, the server also appends a User entry to the command log.

### GET `/api/lanes`

Returns the full `Lane[]` array. Kept for backward compatibility; prefer
`/api/tick` in the UI.

### GET `/api/alarms`, POST `/api/alarms/{id}/resolve`

`GET` returns `AlarmEntry[]`. `POST .../resolve` marks the alarm resolved
in server state (persists across GET calls) and records a User command
log entry. Returns the updated alarm or `404` if the id is unknown.

### GET / POST `/api/safety`

`GET` returns current `SafetySettings`. `POST` validates and persists
them server-side.

Validation (all numeric fields must be finite numbers within range):

| Field               | Min | Max |
|---------------------|-----|-----|
| maxBpmStep          | 0   | 50  |
| maxConveyorSpeed    | 0   | 100 |
| maxServoLoad        | 0   | 100 |
| maxMotorLoad        | 0   | 100 |
| maxRejectRate       | 0   | 100 |
| maxJamPer10min      | 0   | 100 |

`aiWritePermission` must be one of: `"Disabled" | "Recommendation Only" | "Limited Write" | "Closed Loop"`.

### GET `/api/scenarios`, `/api/hardware`

Read-only mocks today. Will be replaced by simulation engine responses.

### GET / POST `/api/simulation`

`GET` returns the current `SimulationBridgeState`. Server advances
`elapsedSeconds` and `bottleCount` by wall-clock delta on every read
while `status === "Running"` — so counters grow between client polls.

`POST` accepts `{ action: "start" | "pause" | "reset" }`. Any other
value returns `422`.

Response fields:

```ts
type SimulationBridgeState = {
  status: "Idle" | "Running" | "Paused" | "Resetting";
  bridge: "Mock" | "External API Ready";
  endpoint: string;       // "/api/simulation" for mock, SIMULATION_API_URL otherwise
  elapsedSeconds: number;
  bottleCount: number;
  lastAction: string;
  message: string;
};
```

### POST `/api/ai/analyze`

Rules-based AI advisor that reads the current production state and returns
an `AIRecommendation`. Body:

```ts
{
  actualBpm: number;
  targetBpm: number;
  jamCount: number;
  rejectCount: number;
  lanes: Lane[];
}
```

Decision tree (driven by `lib/thresholds.ts` → `aiAnalyzeThresholds`):

1. If any lane is Warning/Jam, `jamCount > jamThreshold`, or max
   utilization `>= highUtilization` → **Reduce Load & Rebalance**
   (recommends `targetBpm - bpmStep`, clamped at `minTargetBpm`).
2. Else if system healthy (`actualBpm ≈ targetBpm`, `rejectCount < rejectHold`,
   `avgUtil < safeAvgUtilization`) → **Optimize — Increase Target**
   (recommends `targetBpm + bpmStep`).
3. Otherwise → **Monitor & Hold**.

### GET / POST `/api/command-log`

`GET` returns the last 120 `CommandLogEntry` items newest-first.
`POST` accepts a partial entry and persists it; required fields are
`source`, `command`, `status`. Optional: `time`, `validationResult`,
`reason`, `id` (auto-generated if missing).

---

## Swapping the mock for the real simulation engine

All endpoints that will eventually reach the engine live in
`lib/server/state.ts`. To wire the engine:

1. Set `SIMULATION_API_URL` (see `.env.example`). `meta.source` will
   flip to `"external"` automatically.
2. In `lib/server/state.ts`, replace the body of `readSimulation()` and
   `applySimulationAction()` with `fetch(env.simulationApiUrl + ...)`.
3. Likewise `readLanes()` and `readOverview()` when the engine starts
   emitting live telemetry — the route handlers do not need to change.
4. Keep the shape of the returned objects identical to the types in
   `lib/types.ts`. The dashboard relies on those types strictly.

## Error handling expectations

- Return `4xx` with `error.message` for validation failures (the UI
  surfaces this message directly via toast).
- Return `5xx` only for unexpected faults; the client will display
  "Request failed: 500 …" to the user.
- Always honor the `ApiEnvelope` shape, including on error responses.
