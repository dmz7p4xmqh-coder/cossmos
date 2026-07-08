import * as React from "react";
import {
  Activity,
  Clock,
  Copy,
  Gauge,
  Link,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UptimeBars } from "@/components/UptimeBars";
import { useI18n } from "@/contexts/i18n";
import {
  certDaysLeft,
  formatDate,
  formatDateTime,
  formatMs,
  formatPercent,
  relativeTime,
} from "@/lib/format";
import { statusMeta } from "@/lib/status";
import type { Service } from "@/lib/types";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-border/70 bg-muted/30 p-3 sm:grid-cols-[8rem_1fr] sm:items-center">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ServiceDetailDialog({
  service,
  open,
  onClose,
  onCopyLink,
}: {
  service: Service;
  open: boolean;
  onClose: () => void;
  onCopyLink: () => void;
}) {
  const { t, lang } = useI18n();
  const titleId = React.useId();
  const meta = statusMeta[service.status];
  const certDays = service.certExpiry ? certDaysLeft(service.certExpiry) : null;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 p-4 sm:p-5">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={titleId} className="truncate text-lg font-semibold">
                {service.name}
              </h3>
              <Badge variant={meta.badge}>{t(meta.labelKey)}</Badge>
              {service.maintenance && (
                <Badge variant="warning">
                  <Wrench className="size-3" />
                  {t("service.maintenance")}
                </Badge>
              )}
            </div>
            {(service.description || service.url) && (
              <p className="break-words text-sm text-muted-foreground">
                {service.description || service.url}
              </p>
            )}
          </div>
          <Button
            aria-label={t("action.close")}
            size="icon-sm"
            variant="outline"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="max-h-[calc(92dvh-5rem)] overflow-y-auto p-4 sm:p-5">
          {service.maintenance && service.maintenanceMessage && (
            <div className="mb-4 flex gap-2 rounded-md border border-warning/30 bg-warning/8 p-3 text-sm text-warning-foreground">
              <Wrench className="mt-0.5 size-4 shrink-0" />
              <p>{service.maintenanceMessage}</p>
            </div>
          )}

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border/70 bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="size-3.5" />
                {t("service.uptime")}
              </div>
              <div className="font-semibold tabular-nums">
                {formatPercent(service.uptime)}
              </div>
            </div>
            <div className="rounded-md border border-border/70 bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gauge className="size-3.5" />
                {t("service.response")}
              </div>
              <div className="font-semibold tabular-nums">
                {formatMs(service.responseMs)}
              </div>
            </div>
            <div className="rounded-md border border-border/70 bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {t("service.lastChecked")}
              </div>
              <div
                className="font-semibold tabular-nums"
                title={formatDateTime(service.lastChecked, lang)}
              >
                {relativeTime(service.lastChecked, lang)}
              </div>
            </div>
          </div>

          <dl className="space-y-2">
            <DetailRow
              label={t("service.target")}
              value={
                service.url ? (
                  <a
                    className="break-all text-info-foreground underline-offset-4 hover:underline"
                    href={service.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {service.url}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label={t("service.group")} value={service.group || "—"} />
            <DetailRow label={t("service.message")} value={service.message || "—"} />
            {service.certExpiry && (
              <DetailRow
                label={t("cert.label")}
                value={
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    <span>{formatDate(service.certExpiry, lang)}</span>
                    {certDays !== null && (
                      <span className="text-muted-foreground">
                        {certDays < 0
                          ? t("cert.expired")
                          : certDays === 0
                            ? t("cert.expiresToday")
                            : t("cert.expiresIn", { n: certDays })}
                      </span>
                    )}
                  </span>
                }
              />
            )}
          </dl>

          <div className="mt-5 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              {t("service.history", { n: service.history.length })}
            </div>
            <UptimeBars
              history={service.history}
              max={service.history.length > 60 ? 90 : 60}
            />
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onCopyLink}>
              <Copy />
              {t("action.copyLink")}
            </Button>
            {service.url && (
              <Button
                render={
                  <a href={service.url} rel="noreferrer" target="_blank">
                    <Link />
                    {t("action.openTarget")}
                  </a>
                }
                variant="outline"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
