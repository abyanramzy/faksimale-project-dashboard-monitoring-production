"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Generic polling hook. Fetches `path` immediately on mount, then every
 * `intervalMs`, and returns the latest data + metadata.
 *
 * - Cancels in-flight requests on unmount via AbortController.
 * - Skips updates after unmount so we don't call setState on dead components.
 * - When `paused` is true, skips the interval (useful when a tab is hidden).
 */
export function useTick<T>(
  path: string,
  intervalMs: number,
  options?: { paused?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (options?.paused) return;

    let active = true;

    async function tick() {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const next = await apiClient.get<T>(path, controller.signal);
        if (!active) return;
        setData(next);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (!active) return;
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }

    tick();
    const handle = window.setInterval(tick, intervalMs);

    return () => {
      active = false;
      window.clearInterval(handle);
      abortRef.current?.abort();
    };
  }, [path, intervalMs, options?.paused]);

  return { data, error, lastUpdated };
}
