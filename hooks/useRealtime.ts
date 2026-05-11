"use client";

import { useEffect, useState } from "react";

export function useRealtime<T>(initialData: T, intervalMs = 3000) {
  const [data, setData] = useState(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setData(initialData);
      setLastUpdated(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [initialData, intervalMs]);

  return { data, lastUpdated };
}
