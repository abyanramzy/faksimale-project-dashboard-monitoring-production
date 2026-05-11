import { AlertTriangle, CheckCircle, Gauge } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Lane } from "@/lib/types";
import { clamp, cn } from "@/lib/utils";

interface LaneCardProps {
  lane: Lane;
}

const statusMap: Record<
  Lane["status"],
  {
    border: string;
    bar: string;
    icon: "check" | "alert";
    badge: BadgeProps["variant"];
  }
> = {
  Normal: {
    border: "border-emerald-400/70",
    bar: "bg-emerald-400",
    icon: "check",
    badge: "success",
  },
  Warning: {
    border: "border-amber-400/80",
    bar: "bg-amber-400",
    icon: "alert",
    badge: "warning",
  },
  Jam: {
    border: "border-red-400/90",
    bar: "bg-red-400",
    icon: "alert",
    badge: "destructive",
  },
  Disabled: {
    border: "border-border opacity-60",
    bar: "bg-muted-foreground",
    icon: "alert",
    badge: "secondary",
  },
};

const priorityClass: Record<Lane["priority"], string> = {
  High: "text-red-300",
  Medium: "text-amber-300",
  Low: "text-muted-foreground",
};

export function LaneCard({ lane }: LaneCardProps) {
  const status = statusMap[lane.status];
  const utilization = clamp(lane.utilization);
  const StatusIcon = status.icon === "check" ? CheckCircle : AlertTriangle;

  return (
    <div className={cn("rounded-lg border bg-background/45 p-4", status.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <h4 className="truncate text-sm font-semibold">{lane.name}</h4>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Priority <span className={priorityClass[lane.priority]}>{lane.priority}</span>
          </div>
        </div>
        <Badge variant={status.badge}>{lane.status}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border/60 bg-card/60 p-3">
          <div className="control-label">BPM</div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-base text-primary">
            <Gauge className="h-3.5 w-3.5" />
            {lane.bpm.toFixed(1)}
          </div>
        </div>
        <div className="rounded-md border border-border/60 bg-card/60 p-3">
          <div className="control-label">Count</div>
          <div className="mt-1 font-mono text-base">{lane.totalCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Utilization</span>
          <span>{utilization}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all", status.bar)}
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>
    </div>
  );
}
