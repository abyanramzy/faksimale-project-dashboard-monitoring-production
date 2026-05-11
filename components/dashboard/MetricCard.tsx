import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricTone = "default" | "good" | "warn" | "danger" | "accent";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
  tone?: MetricTone;
}

const toneClasses: Record<MetricTone, string> = {
  default: "text-foreground",
  good: "text-emerald-300",
  warn: "text-amber-300",
  danger: "text-red-300",
  accent: "text-primary",
};

export function MetricCard({
  label,
  value,
  sub,
  icon,
  className,
  valueClassName,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="control-label">{label}</div>
            <div className={cn("mt-2 truncate text-2xl font-semibold", toneClasses[tone], valueClassName)}>
              {value}
            </div>
          </div>
          {icon && (
            <div className="rounded-md border border-border/70 bg-background/50 p-2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        {sub && <div className="mt-3 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
