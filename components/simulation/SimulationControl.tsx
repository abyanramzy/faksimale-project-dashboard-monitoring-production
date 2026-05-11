"use client";

import { useEffect, useState } from "react";
import { Activity, Pause, Play, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTick } from "@/hooks/useTick";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { pollingIntervals } from "@/lib/thresholds";
import type { SimulationAction, SimulationBridgeState } from "@/lib/types";

/**
 * Polls /api/simulation at tickMs cadence. Because the server-side
 * applySimulationAction() and readSimulation() both advance elapsed/bottles
 * from a wall-clock delta, those counters now grow even without client POSTs.
 */
export function SimulationControl() {
  const { setSimulationState, pushToast } = useAppStore();
  const simRunning = useAppStore((s) => s.simRunning);
  const simElapsed = useAppStore((s) => s.simElapsed);
  const simBottles = useAppStore((s) => s.simBottles);
  const [isSending, setIsSending] = useState(false);

  const { data: bridge, error } = useTick<SimulationBridgeState>(
    "/api/simulation",
    pollingIntervals.tickMs
  );

  useEffect(() => {
    if (!bridge) return;
    setSimulationState(bridge.status === "Running", bridge.elapsedSeconds, bridge.bottleCount);
  }, [bridge, setSimulationState]);

  async function sendAction(action: SimulationAction) {
    setIsSending(true);
    try {
      const next = await apiClient.post<SimulationBridgeState>("/api/simulation", { action });
      setSimulationState(next.status === "Running", next.elapsedSeconds, next.bottleCount);
      pushToast({ kind: "info", message: next.message });
    } catch (err) {
      pushToast({ kind: "error", message: `Simulation ${action} gagal: ${(err as Error).message}` });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Simulation Bridge</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Adapter awal untuk REST API 3D simulation. Set SIMULATION_API_URL untuk melewati mock.
              </p>
            </div>
            <Badge variant={bridge?.bridge === "External API Ready" ? "success" : "secondary"}>
              {bridge?.bridge ?? "Mock"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              Simulation bridge error: {error.message}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-background/45 p-4">
              <div className="control-label">Status</div>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                <span
                  className={
                    simRunning
                      ? "h-2.5 w-2.5 rounded-full bg-emerald-400"
                      : "h-2.5 w-2.5 rounded-full bg-muted-foreground"
                  }
                />
                {bridge?.status ?? "Idle"}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/45 p-4">
              <div className="control-label">Elapsed</div>
              <div className="mt-2 font-mono text-2xl font-semibold text-primary">
                {simElapsed}s
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/45 p-4">
              <div className="control-label">Bottles</div>
              <div className="mt-2 font-mono text-2xl font-semibold">
                {simBottles.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/60 p-4">
            <div className="control-label">Endpoint</div>
            <div className="mt-2 break-all font-mono text-sm text-primary">
              {bridge?.endpoint ?? "/api/simulation"}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {bridge?.message ??
                "Set SIMULATION_API_URL di environment untuk mengarah ke API 3D simulation production."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => sendAction("start")} disabled={isSending || simRunning}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button
              variant="secondary"
              onClick={() => sendAction("pause")}
              disabled={isSending || !simRunning}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button variant="outline" onClick={() => sendAction("reset")} disabled={isSending}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Integration Contract
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-lg border border-border/70 bg-background/45 p-3">
            <div className="control-label">Input</div>
            <p className="mt-2 font-mono text-xs">POST {"{"} action: &quot;start&quot; | &quot;pause&quot; | &quot;reset&quot; {"}"}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/45 p-3">
            <div className="control-label">Output</div>
            <p className="mt-2 font-mono text-xs">
              {"{"} status, elapsedSeconds, bottleCount, lastAction, message {"}"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/45 p-3">
            <div className="control-label">Next Step</div>
            <p className="mt-2">Lihat docs/API_CONTRACT.md untuk mapping ke simulation engine.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
