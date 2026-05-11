import { mockCommandLog } from "@/lib/mock-data";
import { ok } from "../_utils";

export async function GET() {
  return ok(mockCommandLog);
}
