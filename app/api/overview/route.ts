import { mockProductionOverview } from "@/lib/mock-data";
import { delay, ok } from "../_utils";

export async function GET() {
  await delay(180);

  const drift = (Math.random() - 0.45) * 1.8;
  const actualBpm = Number((mockProductionOverview.actualBpm + drift).toFixed(1));
  const rejectCount = mockProductionOverview.rejectCount + (actualBpm > 121 ? 1 : 0);

  return ok({
    ...mockProductionOverview,
    actualBpm,
    rejectCount,
    totalInput: mockProductionOverview.totalInput + Math.round(actualBpm * 0.2),
    totalOutput: mockProductionOverview.totalOutput + Math.round(actualBpm * 0.19),
  });
}
