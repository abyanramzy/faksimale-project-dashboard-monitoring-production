"use client";

import { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import type { SafetySettings } from "@/lib/types";
import { cn, unwrapApiData } from "@/lib/utils";

const numericFields: Array<{
  key: keyof Omit<SafetySettings, "aiWritePermission">;
  label: string;
  unit: string;
}> = [
  { key: "maxBpmStep", label: "Max BPM Step", unit: "BPM" },
  { key: "maxConveyorSpeed", label: "Max Conveyor Speed", unit: "%" },
  { key: "maxServoLoad", label: "Max Servo Load", unit: "%" },
  { key: "maxMotorLoad", label: "Max Motor Load", unit: "%" },
  { key: "maxRejectRate", label: "Max Reject Rate", unit: "%" },
  { key: "maxJamPer10min", label: "Max Jam per 10 Min", unit: "events" },
];

const permissions: SafetySettings["aiWritePermission"][] = [
  "Disabled",
  "Recommendation Only",
  "Limited Write",
  "Closed Loop",
];

export function SafetyBoundarySettings() {
  const { safetySettings, updateSafetySettings, addCommandLog } = useAppStore();
  const [draft, setDraft] = useState<SafetySettings>(safetySettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchSafetySettings() {
      try {
        const response = await fetch("/api/safety");
        if (!response.ok) throw new Error("Safety request failed");

        const payload = await response.json();
        const data = unwrapApiData<SafetySettings>(payload);

        if (!mounted) return;
        setDraft(data);
        updateSafetySettings(data);
      } catch (error) {
        console.error("Failed to fetch safety settings:", error);
      }
    }

    fetchSafetySettings();

    return () => {
      mounted = false;
    };
  }, [updateSafetySettings]);

  const updateNumber = (key: keyof Omit<SafetySettings, "aiWritePermission">, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) throw new Error("Safety save failed");

      const payload = await response.json();
      const data = unwrapApiData<SafetySettings>(payload);

      updateSafetySettings(data);
      setDraft(data);
      addCommandLog({
        time: new Date().toLocaleTimeString(),
        source: "User",
        command: "Update Safety Boundary",
        validationResult: "OK",
        status: "Validated",
        reason: `AI write permission: ${data.aiWritePermission}`,
      });
    } catch (error) {
      console.error("Failed to save safety settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Safety Boundary
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Guardrail operator sebelum AI agent mengubah target atau routing.
            </p>
          </div>
          <Button onClick={saveSettings} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {numericFields.map((field) => (
            <label key={field.key} className="rounded-lg border border-border/70 bg-background/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="control-label">{field.label}</span>
                <span className="text-xs text-muted-foreground">{field.unit}</span>
              </div>
              <Input
                type="number"
                min={0}
                step={field.key === "maxRejectRate" ? 0.1 : 1}
                value={draft[field.key]}
                onChange={(event) => updateNumber(field.key, event.target.value)}
                className="mt-3"
              />
            </label>
          ))}
        </div>

        <label className="block rounded-lg border border-border/70 bg-background/45 p-4">
          <div className="control-label">AI Write Permission</div>
          <select
            value={draft.aiWritePermission}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                aiWritePermission: event.target.value as SafetySettings["aiWritePermission"],
              }))
            }
            className={cn(
              "mt-3 h-10 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            )}
          >
            {permissions.map((permission) => (
              <option key={permission} value={permission}>
                {permission}
              </option>
            ))}
          </select>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Recommendation Only tetap mewajibkan operator menekan Apply. Closed Loop sebaiknya
            dipakai setelah simulation API dan safety validation sudah stabil.
          </p>
        </label>
      </CardContent>
    </Card>
  );
}
