"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Gauge, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { mockHardwareAdvisor } from "@/lib/mock-data";
import type { HardwareAdvisor } from "@/lib/types";

export function HardwareAdvisorPanel() {
  const [advisor, setAdvisor] = useState<HardwareAdvisor>(mockHardwareAdvisor);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .get<HardwareAdvisor>("/api/hardware")
      .then((data) => {
        if (active) setAdvisor(data);
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Bottleneck
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-amber-200">{advisor.bottleneck}</div>
              <Badge variant="warning">{advisor.priority}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{advisor.evidence}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="control-label">Expected Gain</div>
              <div className="mt-2 text-sm font-semibold text-primary">{advisor.expectedGain}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="control-label">Decision</div>
              <div className="mt-2 text-sm font-semibold">Engineering Review</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Upgrade Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-background/45 p-4 text-sm leading-6">
            {advisor.recommendedUpgrade}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-primary" />
                Throughput
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Simulasikan target 145 BPM sebelum pembelian hardware.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                Safety
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Validasi servo load, reject rate, dan jam per 10 menit.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gauge className="h-4 w-4 text-primary" />
                API Signal
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Kirim load motor dan diverter cycle time dari simulation API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
