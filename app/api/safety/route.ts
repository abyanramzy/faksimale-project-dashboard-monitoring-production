import { NextRequest } from "next/server";
import { mockSafetySettings } from "@/lib/mock-data";
import type { SafetySettings } from "@/lib/types";
import { fail, ok } from "../_utils";

export async function GET() {
  return ok(mockSafetySettings);
}

export async function POST(req: NextRequest) {
  let settings: SafetySettings;

  try {
    settings = await req.json();
  } catch {
    return fail("Payload safety settings tidak valid.", 400);
  }

  const numericFields: Array<keyof Omit<SafetySettings, "aiWritePermission">> = [
    "maxBpmStep",
    "maxConveyorSpeed",
    "maxServoLoad",
    "maxMotorLoad",
    "maxRejectRate",
    "maxJamPer10min",
  ];

  const invalidField = numericFields.find((field) => {
    const value = settings[field];
    return typeof value !== "number" || Number.isNaN(value) || value < 0;
  });

  if (invalidField) {
    return fail(`Field ${invalidField} harus berupa angka positif.`, 422);
  }

  return ok(settings);
}
