import type { Status } from "./types";

/** Badge variants exposed by the vendored COSS UI badge component. */
type BadgeVariant = "success" | "warning" | "destructive" | "secondary";

export interface StatusMeta {
  /** i18n key under status.* */
  labelKey: string;
  /** solid background utility for dots/bars */
  dot: string;
  /** COSS UI badge variant for this status */
  badge: BadgeVariant;
  /** CSS color used for the pulsing halo */
  ring: string;
}

export const statusMeta: Record<Status, StatusMeta> = {
  up: {
    labelKey: "status.up",
    dot: "bg-success",
    badge: "success",
    ring: "var(--success)",
  },
  degraded: {
    labelKey: "status.degraded",
    dot: "bg-warning",
    badge: "warning",
    ring: "var(--warning)",
  },
  down: {
    labelKey: "status.down",
    dot: "bg-destructive",
    badge: "destructive",
    ring: "var(--destructive)",
  },
  pending: {
    labelKey: "status.pending",
    dot: "bg-muted-foreground",
    badge: "secondary",
    ring: "var(--muted-foreground)",
  },
};

/** overallMessageKey maps the overall status to its hero headline key. */
export function overallMessageKey(status: Status): string {
  switch (status) {
    case "up":
      return "overall.up";
    case "degraded":
      return "overall.degraded";
    case "down":
      return "overall.down";
    default:
      return "overall.pending";
  }
}
