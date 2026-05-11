"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const toneMap = {
  success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  error: "border-red-400/40 bg-red-500/10 text-red-100",
  info: "border-border/80 bg-card/90 text-foreground",
};

/**
 * Fixed-position toast stack fed by useAppStore.toasts.
 * Each toast auto-dismisses after 4s; click dismisses immediately.
 */
export function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const handle = window.setTimeout(() => dismissToast(latest.id), 4000);
    return () => window.clearTimeout(handle);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.kind];
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm shadow-lg backdrop-blur-sm transition-opacity",
              toneMap[toast.kind]
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-5">{toast.message}</span>
          </button>
        );
      })}
    </div>
  );
}
