import { useI18n } from "@/contexts/i18n";
import { formatDateTime, formatMs } from "@/lib/format";
import { statusMeta } from "@/lib/status";
import type { CheckPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Renders the recent check history as a row of bars (oldest left, newest right),
 * padding the left with muted placeholders so the row keeps a stable width.
 */
export function UptimeBars({
  history,
  max = 60,
}: {
  history: CheckPoint[];
  max?: number;
}) {
  const { t, lang } = useI18n();
  const slice = history.slice(-max);
  const pad = Math.max(0, max - slice.length);

  return (
    <div className="flex h-7 items-stretch gap-[2px] sm:gap-[3px]">
      {Array.from({ length: pad }).map((_, i) => (
        <span
          key={`pad-${i}`}
          className="flex-1 rounded-[2px] bg-muted/60"
        />
      ))}
      {slice.map((p, i) => (
        <span
          key={i}
          title={`${formatDateTime(p.t, lang)} · ${t(statusMeta[p.s].labelKey)} · ${formatMs(p.r)}`}
          className={cn(
            "flex-1 rounded-[2px] transition-opacity hover:opacity-70",
            statusMeta[p.s].dot,
          )}
        />
      ))}
    </div>
  );
}
