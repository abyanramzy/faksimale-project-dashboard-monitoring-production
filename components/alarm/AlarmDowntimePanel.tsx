"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import type { AlarmEntry } from "@/lib/types";

const severityBadge: Record<AlarmEntry["severity"], BadgeProps["variant"]> = {
  Critical: "destructive",
  Warning: "warning",
  Info: "secondary",
};

/**
 * Alarm list is kept fresh by the /api/tick poller owned by OverviewPanel.
 * This component only reads alarms from the store and triggers the server-side
 * resolve endpoint so the change survives future ticks.
 */
export function AlarmDowntimePanel() {
  const { alarms, markAlarmResolved, pushToast } = useAppStore();
  const activeAlarms = alarms.filter((alarm) => alarm.active);
  const resolvedAlarms = alarms.filter((alarm) => !alarm.active);
  const totalDowntime = alarms.reduce((sum, alarm) => sum + (alarm.downtimeMinutes ?? 0), 0);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function handleResolve(alarm: AlarmEntry) {
    setResolvingId(alarm.id);
    // Optimistic update so the UI feels instant.
    markAlarmResolved(alarm.id);
    try {
      await apiClient.post<AlarmEntry>(`/api/alarms/${alarm.id}/resolve`);
      pushToast({ kind: "success", message: `Alarm ${alarm.code} diselesaikan.` });
    } catch (error) {
      pushToast({
        kind: "error",
        message: `Gagal menyelesaikan alarm ${alarm.code}: ${(error as Error).message}`,
      });
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Active Alarms
            </CardTitle>
            <Badge variant={activeAlarms.length > 0 ? "destructive" : "success"}>
              {activeAlarms.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeAlarms.length === 0 ? (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-8 text-center text-muted-foreground">
              <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-300" />
              No active alarms
            </div>
          ) : (
            activeAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                disabled={resolvingId === alarm.id}
                onResolve={() => handleResolve(alarm)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Downtime Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-background/45 p-4">
            <div className="control-label">Total Downtime</div>
            <div className="mt-2 font-mono text-3xl font-semibold text-amber-300">
              {totalDowntime}m
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/45 p-4">
            <div className="control-label">History</div>
            <div className="mt-2 text-2xl font-semibold">{resolvedAlarms.length}</div>
          </div>
          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {resolvedAlarms.map((alarm) => (
              <div key={alarm.id} className="rounded-lg border border-border/70 bg-card/60 p-3 opacity-80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{alarm.code}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{alarm.description}</div>
                  </div>
                  <Badge variant="secondary">Resolved</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AlarmCard({
  alarm,
  onResolve,
  disabled,
}: {
  alarm: AlarmEntry;
  onResolve: () => void;
  disabled: boolean;
}) {
  const Icon = alarm.severity === "Critical" ? AlertCircle : AlertTriangle;

  return (
    <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-0.5 h-4 w-4 text-red-300" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{alarm.code}</p>
              <Badge variant={severityBadge[alarm.severity]}>{alarm.severity}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{alarm.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Cause: {alarm.cause}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-end">
          <span className="text-xs text-muted-foreground">{alarm.time}</span>
          <Button variant="outline" size="sm" onClick={onResolve} disabled={disabled}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {disabled ? "Resolving..." : "Resolve"}
          </Button>
        </div>
      </div>
    </div>
  );
}
