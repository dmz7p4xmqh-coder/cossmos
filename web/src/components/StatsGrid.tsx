import { useI18n } from "@/contexts/i18n";
import { formatPercent } from "@/lib/format";
import type { Stats } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatsGrid({ stats }: { stats: Stats }) {
  const { t } = useI18n();

  const items = [
    {
      key: "operational",
      label: t("stats.operational"),
      value: String(stats.up),
      accent: "text-success",
      dot: "bg-success",
    },
    {
      key: "degraded",
      label: t("stats.degraded"),
      value: String(stats.degraded),
      accent: "text-warning",
      dot: "bg-warning",
    },
    {
      key: "down",
      label: t("stats.down"),
      value: String(stats.down),
      accent: "text-destructive",
      dot: "bg-destructive",
    },
    {
      key: "uptime",
      label: t("stats.avgUptime"),
      value: formatPercent(stats.avgUptime),
      accent: "text-info",
      dot: "bg-info",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.map((it) => (
        <div
          key={it.key}
          className="rounded-xl border bg-card p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {it.label}
            </span>
            <span className={cn("size-2 shrink-0 rounded-full", it.dot)} />
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums sm:text-3xl",
              it.accent,
            )}
          >
            {it.value}
          </p>
        </div>
      ))}
    </div>
  );
}
