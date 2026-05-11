import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { applySimulationAction, appendCommandLog, readSimulation } from "@/lib/server/state";
import type { SimulationAction, SimulationBridgeState } from "@/lib/types";
import { fail, ok } from "../_utils";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: SimulationAction[] = ["start", "pause", "reset"];

function withBridgeMetadata(state: SimulationBridgeState): SimulationBridgeState {
  return {
    ...state,
    bridge: env.simulationApiUrl ? "External API Ready" : "Mock",
    endpoint: env.simulationApiUrl ?? state.endpoint,
  };
}

export async function GET() {
  return ok(withBridgeMetadata(readSimulation()));
}

export async function POST(req: NextRequest) {
  let body: { action?: SimulationAction };

  try {
    body = (await req.json()) as { action?: SimulationAction };
  } catch {
    return fail("Payload simulation action tidak valid.", 400);
  }

  const action = body.action;

  if (!action || !VALID_ACTIONS.includes(action)) {
    return fail(`Action simulation harus salah satu dari: ${VALID_ACTIONS.join(", ")}.`, 422);
  }

  const next = applySimulationAction(action);

  appendCommandLog({
    time: new Date().toLocaleTimeString(),
    source: "User",
    command: `Simulation ${action}`,
    validationResult: "OK",
    status: "Acknowledged",
    reason: next.message,
  });

  return ok(withBridgeMetadata(next));
}
