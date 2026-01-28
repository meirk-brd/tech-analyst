"use client";

import { useState, useCallback, useEffect } from "react";
import { apiUrl } from "@/lib/base-path";

export type SessionListItem = {
  id: string;
  marketSector: string;
  createdAt: string;
  companyCount: number;
};

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/sessions"));

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    sessions,
    isLoading,
    error,
    refresh,
  };
}
