import * as React from "react";
import { Activity, Copy, Gauge, Info, ShieldCheck, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceDetailDialog } from "@/components/ServiceDetailDialog";
import { StatusDot } from "./StatusDot";
import { UptimeBars } from "./UptimeBars";
import { useI18n } from "@/contexts/i18n";
import { certDaysLeft, formatDate, formatMs, formatPercent } from "@/lib/format";
import { statusMeta } from "@/lib/status";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

/** TLS certificate expiry line, colour-coded by how soon it expires. */
function CertLine({ expiry }: { expiry: string }) {
  const { t, lang } = useI18n();
  const days = certDaysLeft(expiry);
  const expired = days < 0;
  const tone =
    expired || days <= 7
      ? "text-destructive-foreground"
      : days <= 30
        ? "text-warning-foreground"
        : "text-success-foreground";
  const daysText = expired
    ? t("cert.expired")
    : days === 0
      ? t("cert.expiresToday")
      : t("cert.expiresIn", { n: days });

  return (
    <div
      className="flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground"
      title={t("cert.validUntil", { date: formatDate(expiry, lang) })}
    >
      <ShieldCheck className="size-3.5 shrink-0" />
      <span>{t("cert.label")}</span>
      <span className="tabular-nums text-foreground">{formatDate(expiry, lang)}</span>
      <span className={cn("ml-auto font-medium tabular-nums", tone)}>{daysText}</span>
    </div>
  );
}

export function ServiceCard({
  service,
  compact = false,
}: {
  service: Service;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const meta = statusMeta[service.status];
  const hasIssue = service.status === "down" || service.status === "degraded";
  const subtitle = service.description || service.url;
  const serviceHash = `service-${service.id}`;

  const copyLink = React.useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${serviceHash}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.hash = serviceHash;
    }
  }, [serviceHash]);

  return (
    <Card
      id={serviceHash}
      className={cn(
        "scroll-mt-24 gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        service.maintenance && "border-warning/40",
      )}
    >
      <div className={cn("flex flex-col p-4 sm:p-5", compact ? "gap-3" : "gap-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <StatusDot status={service.status} pulse={hasIssue} className="mt-1.5" />
            <div className="min-w-0">
              <h3 className="truncate font-medium leading-tight">{service.name}</h3>
              {subtitle && (
                <p
                  className="truncate text-xs text-muted-foreground"
                  title={service.url}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {service.maintenance && (
              <Badge variant="warning" title={service.maintenanceMessage}>
                <Wrench className="size-3" />
                {t("service.maintenance")}
              </Badge>
            )}
            <Badge variant={meta.badge}>{t(meta.labelKey)}</Badge>
          </div>
        </div>

        {service.maintenance && service.maintenanceMessage && (
          <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
            <Wrench className="size-3.5 shrink-0" />
            <span className="truncate">{service.maintenanceMessage}</span>
          </p>
        )}

        {hasIssue && service.message && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            <span className="truncate">{service.message}</span>
          </p>
        )}

        <UptimeBars
          history={service.history}
          max={compact ? 36 : service.history.length > 60 ? 90 : 60}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="size-3.5" />
            {t("service.uptime")}
            <b className="font-semibold tabular-nums text-foreground">
              {formatPercent(service.uptime)}
            </b>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            {t("service.response")}
            <b className="font-semibold tabular-nums text-foreground">
              {formatMs(service.responseMs)}
            </b>
          </span>
        </div>

        {service.certExpiry && !compact && <CertLine expiry={service.certExpiry} />}

        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy />
            {copied ? t("action.copied") : t("action.copyLink")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Info />
            {t("action.details")}
          </Button>
        </div>
      </div>
      <ServiceDetailDialog
        open={open}
        service={service}
        onClose={() => setOpen(false)}
        onCopyLink={copyLink}
      />
    </Card>
  );
}
