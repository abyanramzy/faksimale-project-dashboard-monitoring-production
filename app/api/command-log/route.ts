import { NextRequest } from "next/server";
import { appendCommandLog, readCommandLog } from "@/lib/server/state";
import type { CommandLogEntry } from "@/lib/types";
import { fail, ok } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(readCommandLog());
}

export async function POST(req: NextRequest) {
  let payload: Partial<CommandLogEntry>;

  try {
    payload = (await req.json()) as Partial<CommandLogEntry>;
  } catch {
    return fail("Payload command log tidak valid.", 400);
  }

  if (
    typeof payload.command !== "string" ||
    typeof payload.source !== "string" ||
    typeof payload.status !== "string"
  ) {
    return fail("Field command, source, dan status wajib diisi.", 422);
  }

  const entry = appendCommandLog({
    time: payload.time ?? new Date().toLocaleTimeString(),
    source: payload.source as CommandLogEntry["source"],
    command: payload.command,
    validationResult: payload.validationResult ?? "OK",
    status: payload.status as CommandLogEntry["status"],
    reason: payload.reason ?? "",
    id: payload.id,
  });

  return ok(entry, { status: 201 });
}
