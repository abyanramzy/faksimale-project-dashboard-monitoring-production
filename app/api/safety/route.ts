import { NextRequest } from "next/server";
import { appendCommandLog, readSafety, writeSafety } from "@/lib/server/state";
import type { SafetySettings } from "@/lib/types";
import { fail, ok } from "../_utils";

export const dynamic = "force-dynamic";

const NUMERIC_FIELDS: Array<{
  key: keyof Omit<SafetySettings, "aiWritePermission">;
  min: number;
  max: number;
}> = [
  { key: "maxBpmStep", min: 0, max: 50 },
  { key: "maxConveyorSpeed", min: 0, max: 100 },
  { key: "maxServoLoad", min: 0, max: 100 },
  { key: "maxMotorLoad", min: 0, max: 100 },
  { key: "maxRejectRate", min: 0, max: 100 },
  { key: "maxJamPer10min", min: 0, max: 100 },
];

const PERMISSIONS: SafetySettings["aiWritePermission"][] = [
  "Disabled",
  "Recommendation Only",
  "Limited Write",
  "Closed Loop",
];

export async function GET() {
  return ok(readSafety());
}

export async function POST(req: NextRequest) {
  let payload: SafetySettings;

  try {
    payload = (await req.json()) as SafetySettings;
  } catch {
    return fail("Payload safety settings tidak valid.", 400);
  }

  for (const field of NUMERIC_FIELDS) {
    const value = payload[field.key];
    if (typeof value !== "number" || Number.isNaN(value)) {
      return fail(`Field ${field.key} harus berupa angka.`, 422);
    }
    if (value < field.min || value > field.max) {
      return fail(
        `Field ${field.key} harus di antara ${field.min} dan ${field.max}.`,
        422
      );
    }
  }

  if (!PERMISSIONS.includes(payload.aiWritePermission)) {
    return fail(
      `aiWritePermission harus salah satu dari: ${PERMISSIONS.join(", ")}.`,
      422
    );
  }

  const saved = writeSafety(payload);

  appendCommandLog({
    time: new Date().toLocaleTimeString(),
    source: "User",
    command: "Update Safety Boundary",
    validationResult: "OK",
    status: "Validated",
    reason: `AI write permission: ${saved.aiWritePermission}`,
  });

  return ok(saved);
}
