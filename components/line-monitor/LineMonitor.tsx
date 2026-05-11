"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Gauge, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { Lane } from "@/lib/types";
import { unwrapApiData } from "@/lib/utils";
import { LaneCard } from "./LaneCard";

export function LineMonitor() {
  const { lanes, overview, updateLanes } = useAppStore();
  const [lastUpdated, setLastUpdated] = useState("initial mock");

  const laneStats = useMemo(() => {
    const totalLaneBpm = lanes.reduce((sum, lane) => sum + lane.bpm, 0);
    const maxUtil = lanes.reduce((max, lane) => Math.max(max, lane.utilization), 0);
    const warningCount = lanes.filter((lane) => lane.status !== "Normal").length;

    return { totalLaneBpm, maxUtil, warningCount };
  }, [lanes]);

  useEffect(() => {
    let mounted = true;

    async function fetchLanes() {
      try {
        const response = await fetch("/api/lanes");
        if (!response.ok) throw new Error("Lane request failed");

        const payload = await response.json();
        const data = unwrapApiData<Lane[]>(payload);

        if (!mounted) return;
        updateLanes(data);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to fetch lanes:", error);
      }
    }

    fetchLanes();
    const interval = setInterval(fetchLanes, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [updateLanes]);

  if (lanes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading lanes data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Line Flow Monitor</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Input conveyor, diverter cycle, dan distribusi output lane
            </p>
          </div>
          <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
            Updated {lastUpdated}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[220px_64px_220px_64px_minmax(0,1fr)] lg:items-center">
            <div className="rounded-lg border border-border/70 bg-background/45 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Input Conveyor
              </div>
              <div className="mt-3 font-mono text-3xl font-semibold text-primary">
                {overview.actualBpm.toFixed(1)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">BPM dari upstream filler</div>
            </div>

            <ArrowRight className="hidden h-6 w-6 justify-self-center text-muted-foreground lg:block" />

            <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <GitBranch className="h-4 w-4" />
                Diverter
              </div>
              <div className="mt-3 font-mono text-3xl font-semibold text-amber-200">500ms</div>
              <div className="mt-1 text-xs text-muted-foreground">Cycle time mock</div>
            </div>

            <ArrowRight className="hidden h-6 w-6 justify-self-center text-muted-foreground lg:block" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {lanes.map((lane) => (
                <LaneCard key={lane.name} lane={lane} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="control-label">Total Lane BPM</div>
            <div className="mt-2 font-mono text-2xl font-semibold text-primary">
              {laneStats.totalLaneBpm.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="control-label">Max Lane Utilization</div>
            <div className="mt-2 font-mono text-2xl font-semibold text-amber-300">
              {laneStats.maxUtil}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="control-label">Lane Warnings</div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Gauge className="h-5 w-5 text-muted-foreground" />
              {laneStats.warningCount}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
