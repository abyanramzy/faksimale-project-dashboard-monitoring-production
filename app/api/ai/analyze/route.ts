import { NextRequest } from "next/server";
import type { AIRecommendation, Lane } from "@/lib/types";
import { delay, fail, ok } from "../../_utils";

interface AnalyzePayload {
  actualBpm: number;
  targetBpm: number;
  jamCount: number;
  rejectCount: number;
  lanes: Lane[];
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePayload(payload: unknown): AnalyzePayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;
  const actualBpm = toNumber(source.actualBpm);
  const targetBpm = toNumber(source.targetBpm);
  const jamCount = toNumber(source.jamCount);
  const rejectCount = toNumber(source.rejectCount);

  if (
    actualBpm === null ||
    targetBpm === null ||
    jamCount === null ||
    rejectCount === null ||
    !Array.isArray(source.lanes) ||
    source.lanes.length === 0
  ) {
    return null;
  }

  const lanes = source.lanes.filter((lane): lane is Lane => {
    if (!lane || typeof lane !== "object") return false;
    const candidate = lane as Partial<Lane>;
    return typeof candidate.name === "string" && typeof candidate.utilization === "number";
  });

  if (lanes.length === 0) {
    return null;
  }

  return {
    actualBpm,
    targetBpm,
    jamCount,
    rejectCount,
    lanes,
  };
}

export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return fail("Payload analisis AI tidak valid.", 400);
  }

  const input = normalizePayload(payload);

  if (!input) {
    return fail("Payload analisis AI harus berisi actualBpm, targetBpm, jamCount, rejectCount, dan lanes.", 422);
  }

  const avgUtil =
    input.lanes.reduce((sum, lane) => sum + lane.utilization, 0) / input.lanes.length;
  const warnLanes = input.lanes.filter(
    (lane) => lane.status === "Warning" || lane.status === "Jam"
  ).length;
  const highestUtilLane = input.lanes.reduce((current, lane) =>
    lane.utilization > current.utilization ? lane : current
  );

  let recommendation: AIRecommendation;

  if (warnLanes > 0 || input.jamCount > 1 || highestUtilLane.utilization >= 92) {
    const recBpm = Math.max(80, input.targetBpm - 5);

    recommendation = {
      decision: "Reduce Load & Rebalance",
      reasoning: `Terdeteksi ${warnLanes} lane berisiko, ${input.jamCount} jam event, dan utilisasi tertinggi ${highestUtilLane.utilization}% pada ${highestUtilLane.name}. AI merekomendasikan penurunan target sementara dan rebalancing routing.`,
      action: `Kurangi target BPM ke ${recBpm} BPM dan aktifkan Adaptive Lane Balancing.`,
      risk: "Sedang - produktivitas turun sementara",
      rollback: "Jika jam tidak berkurang dalam 5 menit, eskalasi ke operator.",
      confidence: 0.78,
      recBpm,
    };
  } else if (input.actualBpm > input.targetBpm - 2 && input.rejectCount < 20 && avgUtil < 88) {
    const recBpm = input.targetBpm + 5;

    recommendation = {
      decision: "Optimize - Increase Target",
      reasoning: `Sistem stabil pada ${input.actualBpm.toFixed(1)} BPM. Actual BPM mendekati target, jam rendah, dan utilisasi rata-rata ${avgUtil.toFixed(0)}% masih aman.`,
      action: `Naikkan target BPM ke ${recBpm} BPM dengan monitoring ketat.`,
      risk: "Rendah - dalam kapasitas hardware",
      rollback: "Rollback jika jam > 2x/10 menit atau reject rate > 1%.",
      confidence: 0.91,
      recBpm,
    };
  } else {
    recommendation = {
      decision: "Monitor & Hold",
      reasoning: `Sistem berada dalam kondisi normal. Deviasi BPM ${(input.targetBpm - input.actualBpm).toFixed(1)} BPM dan utilisasi rata-rata ${avgUtil.toFixed(0)}%. Tidak ada tindakan diperlukan saat ini.`,
      action: "Pertahankan kondisi saat ini. Lanjutkan monitoring.",
      risk: "Minimal",
      rollback: "Jam > 3x/10 menit atau reject rate > 1.5%.",
      confidence: 0.94,
    };
  }

  await delay(900);
  return ok(recommendation);
}
