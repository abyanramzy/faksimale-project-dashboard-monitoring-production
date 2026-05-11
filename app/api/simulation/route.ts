import { NextRequest } from "next/server";
import { mockSimulationBridge } from "@/lib/mock-data";
import type { SimulationAction, SimulationBridgeState } from "@/lib/types";
import { fail, ok } from "../_utils";

function withEndpoint(state: SimulationBridgeState): SimulationBridgeState {
  const endpoint = process.env.SIMULATION_API_URL ?? state.endpoint;

  return {
    ...state,
    bridge: process.env.SIMULATION_API_URL ? "External API Ready" : "Mock",
    endpoint,
  };
}

export async function GET() {
  return ok(withEndpoint(mockSimulationBridge));
}

export async function POST(req: NextRequest) {
  let action: SimulationAction;

  try {
    const payload = (await req.json()) as { action?: SimulationAction };
    action = payload.action as SimulationAction;
  } catch {
    return fail("Payload simulation action tidak valid.", 400);
  }

  if (!["start", "pause", "reset"].includes(action)) {
    return fail("Action simulation harus start, pause, atau reset.", 422);
  }

  const elapsedSeconds = action === "reset" ? 0 : Math.floor(180 + Math.random() * 120);
  const bottleCount = action === "reset" ? 0 : Math.floor(360 + Math.random() * 180);
  const status = action === "start" ? "Running" : action === "pause" ? "Paused" : "Resetting";

  return ok(
    withEndpoint({
      ...mockSimulationBridge,
      status,
      elapsedSeconds,
      bottleCount,
      lastAction: action,
      message:
        action === "start"
          ? "Simulasi mock berjalan. Data ini siap diganti oleh response 3D simulation API."
          : action === "pause"
            ? "Simulasi mock dijeda. State terakhir dipertahankan untuk analisis."
            : "State simulasi mock direset.",
    })
  );
}
