import { NextResponse } from "next/server";
import { env, simulationSource } from "@/lib/env";

function meta() {
  return {
    source: simulationSource(),
    generatedAt: new Date().toISOString(),
    simulationEndpoint: env.simulationApiUrl,
  };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, meta: meta() }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        message,
        details,
      },
      meta: meta(),
    },
    { status }
  );
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
