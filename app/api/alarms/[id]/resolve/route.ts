import { NextRequest } from "next/server";
import { appendCommandLog, resolveAlarm } from "@/lib/server/state";
import { fail, ok } from "../../../_utils";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const resolved = resolveAlarm(params.id);
  if (!resolved) {
    return fail(`Alarm dengan id "${params.id}" tidak ditemukan.`, 404);
  }

  appendCommandLog({
    time: new Date().toLocaleTimeString(),
    source: "User",
    command: `Resolve alarm ${resolved.code}`,
    validationResult: "OK",
    status: "Acknowledged",
    reason: `Operator menyelesaikan alarm: ${resolved.description}`,
  });

  return ok(resolved);
}
