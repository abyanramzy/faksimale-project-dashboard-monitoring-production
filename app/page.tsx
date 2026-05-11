"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Box,
  Cpu,
  Gauge,
  Target,
  Terminal,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastStack } from "@/components/ui/toast";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { LineMonitor } from "@/components/line-monitor/LineMonitor";
import { AIAgentPanel } from "@/components/ai-agent/AIAgentPanel";
import { SimulationControl } from "@/components/simulation/SimulationControl";
import { ScenarioComparisonTable } from "@/components/scenario/ScenarioComparisonTable";
import { HardwareAdvisorPanel } from "@/components/hardware/HardwareAdvisorPanel";
import { AlarmDowntimePanel } from "@/components/alarm/AlarmDowntimePanel";
import { CommandLogTable } from "@/components/command-log/CommandLogTable";
import { SafetyBoundarySettings } from "@/components/settings/SafetyBoundarySettings";
import { useAppStore } from "@/lib/store";

const tabs = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "line", label: "Line Monitor", icon: Gauge },
  { value: "ai", label: "AI Agent", icon: Cpu },
  { value: "sim", label: "Simulation", icon: Box },
  { value: "scenario", label: "Scenarios", icon: Target },
  { value: "hardware", label: "Hardware", icon: Zap },
  { value: "alarms", label: "Alarms", icon: AlertTriangle },
  { value: "logs", label: "Command Log", icon: Terminal },
  { value: "safety", label: "Safety", icon: AlertCircle },
];

export default function Home() {
  const { overview, simRunning } = useAppStore();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="control-panel overflow-hidden">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">
                  Production AI Control Room
                </span>
                <span>Filler to Diverter to 4 Lane Sorting</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  ClosedLoop AI - Bottle Line Operations
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Dashboard monitoring produksi botol minuman dengan AI advisor, safety boundary,
                  command audit, dan bridge awal untuk 3D simulation API.
                </p>
              </div>
            </div>

            <div className="grid min-w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="control-label">Machine</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_hsl(160_84%_45%)]" />
                  {overview.machineStatus}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="control-label">AI Guard</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
                  <Cpu className="h-4 w-4" />
                  {overview.aiMode}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="control-label">Bridge</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-300">
                  <Activity className="h-4 w-4" />
                  {simRunning ? "Simulation Running" : "Mock API"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-lg border border-border/70 bg-card/80 p-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-10 gap-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            <OverviewPanel />
          </TabsContent>
          <TabsContent value="line">
            <LineMonitor />
          </TabsContent>
          <TabsContent value="ai">
            <AIAgentPanel />
          </TabsContent>
          <TabsContent value="sim">
            <SimulationControl />
          </TabsContent>
          <TabsContent value="scenario">
            <ScenarioComparisonTable />
          </TabsContent>
          <TabsContent value="hardware">
            <HardwareAdvisorPanel />
          </TabsContent>
          <TabsContent value="alarms">
            <AlarmDowntimePanel />
          </TabsContent>
          <TabsContent value="logs">
            <CommandLogTable />
          </TabsContent>
          <TabsContent value="safety">
            <SafetyBoundarySettings />
          </TabsContent>
        </Tabs>
      </div>
      <ToastStack />
    </main>
  );
}
