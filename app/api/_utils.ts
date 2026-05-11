import { NextResponse } from "next/server";

function meta() {
  return {
    source: process.env.SIMULATION_API_URL ? "external" : "mock",
    generatedAt: new Date().toISOString(),
    simulationEndpoint: process.env.SIMULATION_API_URL ?? null,
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
