# Faksimale ClosedLoop AI — Production Dashboard

A monitoring dashboard for a bottle production line (filler → diverter →
4 lane sorting) built with Next.js 14, TypeScript, Tailwind, and Zustand.
It provides operator-in-the-loop AI recommendations, safety boundary
guardrails, command audit log, and a bridge to an external 3D simulation
engine.

## Quick start

```bash
npm install
cp .env.example .env.local   # edit as needed
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # start built app
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
```

## Architecture at a glance

```
app/
  api/                     REST handlers (stateless, talk to lib/server/state)
    tick/route.ts          consolidated snapshot for live dashboard
    overview, lanes, alarms, alarms/[id]/resolve, command-log,
    safety, scenarios, hardware, simulation, ai/analyze
  page.tsx                 tabs shell (OverviewPanel, LineMonitor, ...)
  layout.tsx

components/                feature panels + shadcn/ui primitives
hooks/useTick.ts           generic polling hook with abort + paused
lib/
  api-client.ts            envelope-aware fetch wrapper (get/post)
  env.ts                   centralized env var reader
  mock-data.ts             baseline seed data for mock mode
  server/state.ts          in-memory server state (source of truth)
  store.ts                 Zustand client store (optimistic + hydration)
  thresholds.ts            all tuning constants (no magic numbers)
  types.ts                 shared domain types
docs/
  API_CONTRACT.md          wire contract for simulation engine handoff
```

**Data flow**

```
Simulation engine / mock  →  lib/server/state.ts  →  /api/*  →  apiClient  →  useTick  →  Zustand store  →  components
                                                              ↑
                            components (user actions, POST) ──┘
```

The `lib/server/state.ts` module is the single choke point — swap its
internals for real `fetch()` calls when the simulation engine is ready,
without touching any route handler or client code.

See [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) for the full wire
contract.

## Current status

- Mock-only by default. Set `SIMULATION_API_URL` in `.env.local` and
  the dashboard will flag itself as "External API Ready" in the bridge
  panel.
- Server state persists across requests within a single Node.js process
  (safety save, alarm resolve, simulation run). It resets on restart;
  for multi-instance production, replace the store with a DB/Redis
  adapter inside `lib/server/state.ts`.
