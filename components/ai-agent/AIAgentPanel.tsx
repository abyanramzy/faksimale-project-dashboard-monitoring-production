"use client";

import { useState } from "react";
import { Activity, CheckCircle, Cpu, RefreshCcw, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import type { AIRecommendation, ProductionOverview } from "@/lib/types";

const aiModes: ProductionOverview["aiMode"][] = [
  "Monitor",
  "Advisor",
  "Assisted Control",
  "Closed Loop",
  "Exploration",
];

export function AIAgentPanel() {
  const {
    overview,
    lanes,
    safetySettings,
    pendingRecommendation,
    setPendingRecommendation,
    addCommandLog,
    patchOverview,
    setPreviousTargetBpm,
    pushToast,
  } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const canApplyRecommendation =
    safetySettings.aiWritePermission !== "Disabled" && Boolean(pendingRecommendation?.recBpm);

  // Persist a target/mode change to the server. Optimistic update via
  // patchOverview keeps the UI responsive; /api/tick will reconcile.
  async function persistOverviewPatch(patch: Partial<ProductionOverview>) {
    patchOverview(patch);
    try {
      await apiClient.post<ProductionOverview>("/api/overview", patch);
    } catch (error) {
      pushToast({
        kind: "error",
        message: `Gagal menyimpan perubahan overview: ${(error as Error).message}`,
      });
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const recommendation = await apiClient.post<AIRecommendation>("/api/ai/analyze", {
        actualBpm: overview.actualBpm,
        targetBpm: overview.targetBpm,
        jamCount: overview.jamCount,
        rejectCount: overview.rejectCount,
        lanes,
      });

      setPendingRecommendation(recommendation);
      addCommandLog({
        time: new Date().toLocaleTimeString(),
        source: "AI Agent",
        command: `Analyze production state - Recommendation: ${recommendation.decision}`,
        validationResult: "OK",
        status: "Acknowledged",
        reason: "AI periodic analysis",
      });
    } catch (error) {
      console.error("Failed to analyze production state:", error);
      setAnalysisError(`Analisis gagal: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!pendingRecommendation?.recBpm) return;

    setPreviousTargetBpm(overview.targetBpm);
    const step = Math.abs(pendingRecommendation.recBpm - overview.targetBpm);
    addCommandLog({
      time: new Date().toLocaleTimeString(),
      source: "User",
      command: `Apply AI Recommendation - Target BPM: ${pendingRecommendation.recBpm}`,
      validationResult: `OK - step: ${step} BPM`,
      status: "Validated",
      reason: `Operator menyetujui rekomendasi AI: ${pendingRecommendation.decision}`,
    });
    await persistOverviewPatch({ targetBpm: pendingRecommendation.recBpm });
    setPendingRecommendation(null);
    pushToast({
      kind: "success",
      message: `Target BPM di-update ke ${pendingRecommendation.recBpm}.`,
    });
  };

  const handleReject = () => {
    addCommandLog({
      time: new Date().toLocaleTimeString(),
      source: "User",
      command: "Reject AI Recommendation",
      validationResult: "-",
      status: "Rejected",
      reason: `Operator menolak rekomendasi AI: ${pendingRecommendation?.decision ?? "no active recommendation"}`,
    });
    setPendingRecommendation(null);
  };

  const handleRollback = async () => {
    const previous = useAppStore.getState().previousTargetBpm;
    if (previous === null) return;

    addCommandLog({
      time: new Date().toLocaleTimeString(),
      source: "User",
      command: `Rollback - Target BPM dikembalikan ke ${previous}`,
      validationResult: "OK",
      status: "Rolled Back",
      reason: "Operator melakukan manual rollback",
    });
    await persistOverviewPatch({ targetBpm: previous });
    setPreviousTargetBpm(null);
    pushToast({ kind: "info", message: `Rollback ke ${previous} BPM.` });
  };

  const handleDisable = async () => {
    addCommandLog({
      time: new Date().toLocaleTimeString(),
      source: "User",
      command: "Disable AI Control - Mode set ke Monitor",
      validationResult: "OK",
      status: "Acknowledged",
      reason: "AI control dinonaktifkan oleh operator",
    });
    await persistOverviewPatch({ aiMode: "Monitor" });
    setPendingRecommendation(null);
  };

  const setAIMode = async (mode: ProductionOverview["aiMode"]) => {
    addCommandLog({
      time: new Date().toLocaleTimeString(),
      source: "User",
      command: `Set AI Mode: ${mode}`,
      validationResult: "OK",
      status: "Acknowledged",
      reason: "Manual mode change",
    });
    await persistOverviewPatch({ aiMode: mode });
    // Monitor mode cannot act on recommendations; clear stale ones.
    if (mode === "Monitor") setPendingRecommendation(null);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              AI Mode
            </CardTitle>
            <Badge variant="secondary">{safetySettings.aiWritePermission}</Badge>
          </div>
          <Tabs value={overview.aiMode} onValueChange={(value: string) => setAIMode(value as ProductionOverview["aiMode"])}>
            <TabsList className="mt-4 grid h-auto w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {aiModes.map((mode) => (
                <TabsTrigger key={mode} value={mode} className="h-9 justify-start">
                  {mode}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="control-label">Target</div>
              <div className="mt-2 font-mono text-xl font-semibold text-primary">{overview.targetBpm}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="control-label">Confidence</div>
              <div className="mt-2 font-mono text-xl font-semibold">
                {Math.round((pendingRecommendation?.confidence ?? 0.94) * 100)}%
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Confidence Score</span>
              <span>{Math.round((pendingRecommendation?.confidence ?? 0.94) * 100)}%</span>
            </div>
            <Progress value={(pendingRecommendation?.confidence ?? 0.94) * 100} className="mt-2 h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>AI Reasoning Summary</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Rekomendasi tetap dicatat ke command log sebelum operator menerapkan perubahan.
              </p>
            </div>
            <Badge variant={pendingRecommendation?.recBpm ? "warning" : "success"}>
              {pendingRecommendation?.decision ?? "Monitor & Hold"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-background/45 p-4 text-sm leading-6">
            {pendingRecommendation?.reasoning ||
              "Sistem beroperasi dalam batas normal. Actual BPM mendekati target dengan deviasi rendah. Lane 3 menunjukkan utilisasi tinggi namun belum melewati batas safety."}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <div className="control-label">Risk</div>
              <div className="mt-2 text-sm">{pendingRecommendation?.risk ?? "Rendah"}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/60 p-3 md:col-span-2">
              <div className="control-label">Proposed Action</div>
              <div className="mt-2 text-sm text-primary">
                {pendingRecommendation?.action ?? "Tidak ada perubahan setpoint. Sistem stabil."}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-amber-200">
              <ShieldAlert className="h-4 w-4" />
              Rollback Condition
            </div>
            <p className="mt-2">
              {pendingRecommendation?.rollback ?? "Jam > 2x/10 menit atau reject rate > 1%."}
            </p>
          </div>

          {analysisError && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {analysisError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              <Activity className="mr-2 h-4 w-4" />
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
            <Button onClick={handleApprove} disabled={!canApplyRecommendation}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Apply
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!pendingRecommendation}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button variant="outline" onClick={handleRollback}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Rollback
            </Button>
            <Button variant="secondary" onClick={handleDisable}>
              <Cpu className="mr-2 h-4 w-4" />
              Disable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
