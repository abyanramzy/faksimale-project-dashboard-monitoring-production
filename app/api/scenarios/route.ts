import { readScenarios } from "@/lib/server/state";
import { ok } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(readScenarios());
}
