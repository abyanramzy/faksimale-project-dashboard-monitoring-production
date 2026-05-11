"use client";

import { useEffect, useState } from "react";
import { Activity, Pause, Play, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { SimulationAction, SimulationBridgeState } from "@/lib/types";
import { unwrapApiData } from "@/lib/utils";

export function SimulationControl() {
  const { simRunning, simElapsed, simBottles, setSimulationState, addCommandLog } = useAppStore();
  const [bridge, setBridge] = useState<SimulationBridgeState | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchBridge() {
      try {
        const response = await fetch("/api/simulation");
        if (!response.ok) throw new Error("Simulation bridge request failed");

        const payload = await response.json();
        const data = unwrapApiData<SimulationBridgeState>(payload);

        if (!mounted) return;
        setBridge(data);
        setSimulationState(data.status === "Running", data.elapsedSeconds, data.bottleCount);
      } catch (error) {
        console.error("Failed to fetch simulation bridge:", error);
      }
    }

    fetchBridge();

    return () => {
      mounted = false;
    };
  }, [setSimulationState]);

  const sendAction = async (action: SimulationAction) => {
    setIsSending(true);

    try {
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Simulation action failed");

      const payload = await response.json();
      const data = unwrapApiData<SimulationBridgeState>(payload);

      setBridge(data);
      setSimulationState(data.status === "Running", data.elapsedSeconds, data.bottleCount);
      addCommandLog({
        time: new Date().toLocaleTimeString(),
        source: "User",
        command: `Simulation ${action}`,
        validationResult: "OK",
        status: "Acknowledged",
        reason: data.message,
      });
    } catch (error) {
      console.error("Failed to send simulation action:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Simulation Bridge</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Adapter awal untuk REST API 3D simulation. Saat ini berjalan dengan mock endpoint lokal.
              </p>
            </div>
            <Badge variant={bridge?.bridge === "External API Ready" ? "success" : "secondary"}>
              {bridge?.bridge ?? "Mock"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
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
            <Button onClick={() => sendAction("start")} disabled={isSending}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button variant="secondary" onClick={() => sendAction("pause")} disabled={isSending}>
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
            <p className="mt-2">action: start | pause | reset</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/45 p-3">
            <div className="control-label">Output</div>
            <p className="mt-2">status, elapsedSeconds, bottleCount, lastAction, message</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/45 p-3">
            <div className="control-label">Next Step</div>
            <p className="mt-2">Ganti mock route dengan request ke simulation engine melalui API bridge.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
