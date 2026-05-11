import { NextRequest } from "next/server";
import { appendCommandLog, patchOverview, readOverview } from "@/lib/server/state";
import type { ProductionOverview } from "@/lib/types";
import { fail, ok } from "../_utils";

export const dynamic = "force-dynamic";

const AI_MODES: ProductionOverview["aiMode"][] = [
  "Monitor",
  "Advisor",
  "Assisted Control",
  "Closed Loop",
  "Exploration",
];

export async function GET() {
  return ok(readOverview());
}

/**
 * Partial update of operator-controlled overview fields (targetBpm, aiMode).
 * Anything else in the payload is ignored to protect live metrics like
 * actualBpm, totalInput, totalOutput from client writes.
 */
export async function POST(req: NextRequest) {
  let body: Partial<ProductionOverview>;

  try {
    body = (await req.json()) as Partial<ProductionOverview>;
  } catch {
    return fail("Payload overview tidak valid.", 400);
  }

  const patch: Partial<ProductionOverview> = {};

  if (body.targetBpm !== undefined) {
    if (typeof body.targetBpm !== "number" || !Number.isFinite(body.targetBpm)) {
      return fail("targetBpm harus berupa angka.", 422);
    }
    if (body.targetBpm < 50 || body.targetBpm > 200) {
      return fail("targetBpm harus di antara 50 dan 200.", 422);
    }
    patch.targetBpm = body.targetBpm;
  }

  if (body.aiMode !== undefined) {
    if (!AI_MODES.includes(body.aiMode)) {
      return fail(`aiMode harus salah satu dari: ${AI_MODES.join(", ")}.`, 422);
    }
    patch.aiMode = body.aiMode;
  }

  if (Object.keys(patch).length === 0) {
    return fail("Tidak ada field yang valid untuk di-update.", 422);
  }

  const updated = patchOverview(patch);

  const changed = Object.keys(patch).join(", ");
  appendCommandLog({
    time: new Date().toLocaleTimeString(),
    source: "User",
    command: `Update overview (${changed})`,
    validationResult: "OK",
    status: "Validated",
    reason: `Target BPM: ${updated.targetBpm}, AI Mode: ${updated.aiMode}`,
  });

  return ok(updated);
}
