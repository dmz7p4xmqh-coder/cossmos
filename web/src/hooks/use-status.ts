import * as React from "react";

import { fetchStatus } from "@/lib/api";
import type { Snapshot } from "@/lib/types";

interface StatusState {
  data: Snapshot | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refreshedAt: number;
}

/**
 * useStatus loads the snapshot once and then polls on the interval advertised by
 * the backend (site.refreshInterval). It keeps the previous data visible while a
 * refresh is in flight so the dashboard never flashes empty.
 */
export function useStatus() {
  const [state, setState] = React.useState<StatusState>({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
    refreshedAt: 0,
  });

  const load = React.useCallback(async (signal?: AbortSignal) => {
    setState((s) => ({ ...s, refreshing: true }));
    try {
      const data = await fetchStatus(signal);
      setState({
        data,
        error: null,
        loading: false,
        refreshing: false,
        refreshedAt: Date.now(),
      });
    } catch (err) {
      if (signal?.aborted || (err as Error).name === "AbortError") return;
      setState((s) => ({
        ...s,
        error: (err as Error).message,
        loading: false,
        refreshing: false,
      }));
    }
  }, []);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const interval = state.data?.site.refreshInterval ?? 0;
  React.useEffect(() => {
    if (interval <= 0) return;
    const id = window.setInterval(() => void load(), interval * 1000);
    return () => window.clearInterval(id);
  }, [interval, load]);

  const reload = React.useCallback(() => void load(), [load]);

  return { ...state, reload };
}
