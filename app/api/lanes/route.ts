import { mockLanes } from "@/lib/mock-data";
import { clamp } from "@/lib/utils";
import { delay, ok } from "../_utils";

export async function GET() {
  await delay(180);

  const lanes = mockLanes.map((lane) => {
    const bpmDrift = (Math.random() - 0.5) * 1.2;
    const utilizationDrift = Math.round((Math.random() - 0.45) * 3);
    const utilization = clamp(lane.utilization + utilizationDrift);

    return {
      ...lane,
      bpm: Number((lane.bpm + bpmDrift).toFixed(1)),
      utilization,
      status: utilization >= 94 ? "Jam" : utilization >= 88 ? "Warning" : "Normal",
      hasJam: utilization >= 94,
    };
  });

  return ok(lanes);
}
