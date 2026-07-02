import type { Snapshot } from "./types";

/**
 * fetchStatus loads the status snapshot. The same relative URL works in both
 * deployment shapes: a real status.json file on GitHub Pages, or the dynamic
 * /status.json route served by the Go binary in serve mode.
 */
export async function fetchStatus(signal?: AbortSignal): Promise<Snapshot> {
  const base = import.meta.env.BASE_URL || "/";
  const url = `${base}status.json?t=${Date.now()}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Snapshot;
}
