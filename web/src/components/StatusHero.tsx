import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/contexts/i18n";
import { relativeTime } from "@/lib/format";
import { overallMessageKey } from "@/lib/status";
import type { Snapshot, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const heroTint: Record<Status, string> = {
  up: "border-success/30 bg-success/[0.06]",
  degraded: "border-warning/30 bg-warning/[0.06]",
  down: "border-destructive/30 bg-destructive/[0.06]",
  pending: "border-border bg-muted/40",
};

const iconTint: Record<Status, string> = {
  up: "bg-success/15 text-success",
  degraded: "bg-warning/15 text-warning",
  down: "bg-destructive/15 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

function iconFor(status: Status) {
  switch (status) {
    case "up":
      return CheckCircle2;
    case "degraded":
      return AlertTriangle;
    case "down":
      return XCircle;
    default:
      return Loader2;
  }
}

interface StatusHeroProps {
  snapshot: Snapshot;
  refreshing: boolean;
  onReload: () => void;
}

export function StatusHero({ snapshot, refreshing, onReload }: StatusHeroProps) {
  const { t, lang } = useI18n();
  const status = snapshot.overall;
  const Icon = iconFor(status);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 animate-fade-up sm:p-6",
        heroTint[status],
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
            iconTint[status],
          )}
        >
          <Icon
            className={cn("size-6 sm:size-7", status === "pending" && "animate-spin")}
          />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-lg font-semibold tracking-tight sm:text-2xl">
            {t(overallMessageKey(status))}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {t("updated.label")} {relativeTime(snapshot.updatedAt, lang)}
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                onClick={onReload}
                aria-label={t("action.refresh")}
                className="button-header shrink-0 rounded-lg"
              >
                <RefreshCw
                  className={cn("size-4", refreshing && "animate-spin")}
                />
              </Button>
            }
          />
          <TooltipContent>{t("action.refresh")}</TooltipContent>
        </Tooltip>
      </div>
    </section>
  );
}
