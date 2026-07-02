import { RefreshCw, ServerCrash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/contexts/i18n";

export function LoadingScreen() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ServerCrash className="size-7" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{t("error.title")}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("error.hint")}
        </p>
        {message && (
          <p className="font-mono text-xs text-muted-foreground/70">{message}</p>
        )}
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="size-4" />
        {t("action.retry")}
      </Button>
    </div>
  );
}

export function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
      {t("filter.empty")}
    </div>
  );
}
