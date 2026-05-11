"use client";

import { useEffect } from "react";
import { Terminal } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { CommandLogEntry } from "@/lib/types";
import { cn, unwrapApiData } from "@/lib/utils";

const statusBadge: Record<CommandLogEntry["status"], BadgeProps["variant"]> = {
  Pending: "secondary",
  Validated: "success",
  Rejected: "destructive",
  Sent: "default",
  Acknowledged: "success",
  "Rolled Back": "warning",
};

const sourceClass: Record<CommandLogEntry["source"], string> = {
  "AI Agent": "text-primary",
  User: "text-amber-300",
  System: "text-muted-foreground",
};

export function CommandLogTable() {
  const { commandLog, setCommandLog } = useAppStore();

  useEffect(() => {
    let mounted = true;

    async function fetchCommandLog() {
      try {
        const response = await fetch("/api/command-log");
        if (!response.ok) throw new Error("Command log request failed");

        const payload = await response.json();
        const data = unwrapApiData<CommandLogEntry[]>(payload);

        if (mounted) setCommandLog(data);
      } catch (error) {
        console.error("Failed to fetch command log:", error);
      }
    }

    fetchCommandLog();

    return () => {
      mounted = false;
    };
  }, [setCommandLog]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Command Log
          </CardTitle>
          <Badge variant="secondary">{commandLog.length} entries</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Time</th>
                <th className="py-3 pr-4 font-medium">Source</th>
                <th className="py-3 pr-4 font-medium">Command</th>
                <th className="py-3 pr-4 font-medium">Validation</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {commandLog.map((log, index) => (
                <tr key={log.id ?? `${log.time}-${index}`} className="table-row-hover">
                  <td className="py-3 pr-4 font-mono text-xs">{log.time}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("font-medium", sourceClass[log.source])}>{log.source}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div>{log.command}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{log.reason}</div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">{log.validationResult}</td>
                  <td className="py-3">
                    <Badge variant={statusBadge[log.status]}>{log.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
