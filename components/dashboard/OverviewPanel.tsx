"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Box,
  Clock,
  Cpu,
  Gauge,
  Target,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTick } from "@/hooks/useTick";
import { useAppStore } from "@/lib/store";
import { overviewThresholds, pollingIntervals, trendChart } from "@/lib/thresholds";
import type { DashboardSnapshot } from "@/lib/types";
import { MetricCard } from "./MetricCard";

interface TrendPoint {
  time: string;
  target: number;
  actual: number;
}

function createInitialHistory(targetBpm: number, actualBpm: number): TrendPoint[] {
  return Array.from({ length: trendChart.historySize }, (_, index) => ({
    time: `${trendChart.historySize - 1 - index}m`,
    target: targetBpm,
    actual: Number((actualBpm + (Math.random() - 0.5) * 2.4).toFixed(1)),
  }));
}

export function OverviewPanel() {
  const { overview, lanes, alarms, setOverview, setLanes, setAlarms, setHydrated } = useAppStore();
  const [history, setHistory] = useState<TrendPoint[]>(() =>
    createInitialHistory(overview.targetBpm, overview.actualBpm)
  );

  const { data: snapshot, error, lastUpdated } = useTick<DashboardSnapshot>(
    "/api/tick",
    pollingIntervals.tickMs
  );

  // Reconcile server snapshot into the client store. Single source of truth
  // for overview/lanes/alarms live data.
  useEffect(() => {
    if (!snapshot) return;
    setOverview(snapshot.overview);
    setLanes(snapshot.lanes);
    setAlarms(snapshot.alarms);
    setHydrated();
    setHistory((previous) => [
      ...previous.slice(1),
      {
        time: "now",
        target: snapshot.overview.targetBpm,
        actual: snapshot.overview.actualBpm,
      },
    ]);
  }, [snapshot, setOverview, setLanes, setAlarms, setHydrated]);

  const calculated = useMemo(() => {
    const yieldRate =
      overview.totalInput > 0 ? (overview.totalOutput / overview.totalInput) * 100 : 0;
    const bpmDelta = overview.actualBpm - overview.targetBpm;
    const activeAlarms = alarms.filter((alarm) => alarm.active).length;
    const averageUtilization =
      lanes.length > 0
        ? lanes.reduce((sum, lane) => sum + lane.utilization, 0) / lanes.length
        : 0;

    return { yieldRate, bpmDelta, activeAlarms, averageUtilization };
  }, [alarms, lanes, overview]);

  // Dynamic Y-axis: pad around min/max so the line doesn't clip.
  const yDomain = useMemo<[number, number]>(() => {
    const values = history.flatMap((p) => [p.actual, p.target]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [
      Math.floor(min - trendChart.axisPadding),
      Math.ceil(max + trendChart.axisPadding),
    ];
  }, [history]);

  const overviewMetrics = [
    {
      label: "Target BPM",
      value: overview.targetBpm,
      icon: <Target className="h-4 w-4" />,
      sub: "Setpoint produksi",
      tone: "accent" as const,
    },
    {
      label: "Actual BPM",
      value: overview.actualBpm.toFixed(1),
      icon: <Activity className="h-4 w-4" />,
      sub: `Delta ${calculated.bpmDelta >= 0 ? "+" : ""}${calculated.bpmDelta.toFixed(1)} BPM`,
      tone:
        Math.abs(calculated.bpmDelta) <= overviewThresholds.bpmDeltaOk
          ? ("good" as const)
          : ("warn" as const),
    },
    {
      label: "Yield",
      value: `${calculated.yieldRate.toFixed(2)}%`,
      icon: <Gauge className="h-4 w-4" />,
      sub: `${overview.rejectCount} reject dari ${overview.totalInput.toLocaleString()} input`,
      tone:
        calculated.yieldRate >= overviewThresholds.yieldGood
          ? ("good" as const)
          : ("warn" as const),
    },
    {
      label: "Best Stable",
      value: overview.bestStableBpm,
      icon: <Zap className="h-4 w-4" />,
      sub: "Benchmark aman",
      tone: "accent" as const,
    },
    {
      label: "Total Output",
      value: overview.totalOutput.toLocaleString(),
      icon: <Box className="h-4 w-4" />,
      sub: `${overview.totalInput.toLocaleString()} input`,
    },
    {
      label: "Jam Events",
      value: overview.jamCount,
      icon: <AlertCircle className="h-4 w-4" />,
      sub: `${calculated.activeAlarms} alarm aktif`,
      tone:
        overview.jamCount > overviewThresholds.jamWarn
          ? ("danger" as const)
          : ("warn" as const),
    },
    {
      label: "Downtime",
      value: `${overview.downtimeMinutes}m`,
      icon: <Clock className="h-4 w-4" />,
      sub: "Shift berjalan",
      tone:
        overview.downtimeMinutes <= overviewThresholds.downtimeGoodMinutes
          ? ("good" as const)
          : ("warn" as const),
    },
    {
      label: "AI Mode",
      value: overview.aiMode,
      icon: <Cpu className="h-4 w-4" />,
      sub: "Operator approval aktif",
      tone: "accent" as const,
    },
  ];

  const updatedLabel = lastUpdated ? lastUpdated.toLocaleTimeString() : "initial mock";

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
          Gagal memuat snapshot: {error.message}. Menampilkan data terakhir yang tersedia.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            sub={metric.sub}
            icon={metric.icon}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>BPM Trend</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Target vs actual, {trendChart.historySize} interval terakhir
              </p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
              Updated {updatedLabel}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={history} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tickLine={false} />
                <YAxis domain={yDomain} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                  name="Target BPM"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Actual BPM"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Constraint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                {overview.currentBottleneck}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Lane balance rata-rata {calculated.averageUtilization.toFixed(0)}%.
                AI advisor akan menahan kenaikan target jika utilisasi lane melewati safety boundary.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="control-label">Status</div>
                <div className="mt-2 text-sm font-medium text-emerald-300">{overview.machineStatus}</div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="control-label">Avg Util</div>
                <div className="mt-2 text-sm font-medium text-primary">
                  {calculated.averageUtilization.toFixed(0)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
