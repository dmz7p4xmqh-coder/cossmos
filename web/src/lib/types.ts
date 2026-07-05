// Mirrors internal/model.Snapshot from the Go backend. Both run modes emit
// exactly this shape as status.json.

export type Status = "up" | "degraded" | "down" | "pending";

export interface CheckPoint {
  /** ISO timestamp */
  t: string;
  /** status */
  s: Status;
  /** response time in ms */
  r: number;
}

export interface Service {
  id: string;
  name: string;
  group?: string;
  url?: string;
  description?: string;
  status: Status;
  responseMs: number;
  uptime: number;
  lastChecked: string;
  message?: string;
  /** TLS certificate expiry (ISO), present for reachable HTTPS endpoints. */
  certExpiry?: string;
  history: CheckPoint[];
}

export interface SiteInfo {
  title: string;
  description?: string;
  logo?: string;
  logoDark?: string;
  icp?: string;
  icpLink?: string;
  policeIcp?: string;
  policeIcpLink?: string;
  footer?: string;
  github?: string;
  hideTargets?: boolean;
  refreshInterval: number;
}

export interface Stats {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgUptime: number;
}

export interface Snapshot {
  generator: string;
  version: string;
  updatedAt: string;
  overall: Status;
  stats: Stats;
  site: SiteInfo;
  services: Service[];
}
