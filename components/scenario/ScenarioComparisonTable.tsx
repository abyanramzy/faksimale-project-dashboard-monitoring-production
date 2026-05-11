"use client";

import { useEffect, useState } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockScenarios } from "@/lib/mock-data";
import type { Scenario } from "@/lib/types";
import { clamp, unwrapApiData } from "@/lib/utils";

const statusBadge: Record<Scenario["status"], BadgeProps["variant"]> = {
  Stable: "success",
  Limit: "warning",
  Unstable: "destructive",
};

export function ScenarioComparisonTable() {
  const [scenarios, setScenarios] = useState<Scenario[]>(mockScenarios);

  useEffect(() => {
    let mounted = true;

    async function fetchScenarios() {
      try {
        const response = await fetch("/api/scenarios");
        if (!response.ok) throw new Error("Scenario request failed");

        const payload = await response.json();
        const data = unwrapApiData<Scenario[]>(payload);

        if (mounted) setScenarios(data);
      } catch (error) {
        console.error("Failed to fetch scenarios:", error);
      }
    }

    fetchScenarios();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Baseline, adaptive routing, dan stress test untuk membaca batas kapasitas sistem.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Scenario</th>
                <th className="py-3 pr-4 font-medium">Target</th>
                <th className="py-3 pr-4 font-medium">Actual</th>
                <th className="py-3 pr-4 font-medium">Jam</th>
                <th className="py-3 pr-4 font-medium">Reject</th>
                <th className="py-3 pr-4 font-medium">Servo</th>
                <th className="py-3 pr-4 font-medium">Motor</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 font-medium">AI Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => (
                <tr key={scenario.name} className="table-row-hover">
                  <td className="py-4 pr-4 font-medium">{scenario.name}</td>
                  <td className="py-4 pr-4 font-mono">{scenario.targetBpm}</td>
                  <td className="py-4 pr-4 font-mono text-primary">{scenario.actualBpm.toFixed(1)}</td>
                  <td className="py-4 pr-4 font-mono">{scenario.jamCount}</td>
                  <td className="py-4 pr-4 font-mono">{scenario.rejectRate.toFixed(2)}%</td>
                  <td className="py-4 pr-4">
                    <LoadBar value={scenario.servoLoad} />
                  </td>
                  <td className="py-4 pr-4">
                    <LoadBar value={scenario.motorLoad} />
                  </td>
                  <td className="py-4 pr-4">
                    <Badge variant={statusBadge[scenario.status]}>{scenario.status}</Badge>
                  </td>
                  <td className="py-4 text-muted-foreground">{scenario.aiRecommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadBar({ value }: { value: number }) {
  const load = clamp(value);
  const color = load >= 90 ? "bg-red-400" : load >= 80 ? "bg-amber-400" : "bg-primary";

  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Load</span>
        <span>{load}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div className={color} style={{ width: `${load}%`, height: "100%" }} />
      </div>
    </div>
  );
}
