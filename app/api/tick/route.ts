/**
 * Consolidated snapshot endpoint.
 *
 * One request, one consistent snapshot. This exists because polling each of
 * /api/overview and /api/lanes separately produced race conditions where the
 * overview's Actual BPM disagreed with the sum of lane BPMs — they were sampled
 * at different moments.
 *
 * Clients that need live data should poll THIS endpoint and split the payload.
 * Clients that need just alarms/command-log can still poll those individually
 * on a slower cadence.
 */

import { readAlarms, readLanes, readOverview } from "@/lib/server/state";
import { ok } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET() {
  // Read in this order so the overview's actualBpm is based on the same tick
  // as the lane updates below.
  const overview = readOverview();
  const lanes = readLanes();
  const alarms = readAlarms();

  return ok({
    overview,
    lanes,
    alarms,
    /** Server wall-clock when this snapshot was assembled. */
    serverTime: new Date().toISOString(),
  });
}
