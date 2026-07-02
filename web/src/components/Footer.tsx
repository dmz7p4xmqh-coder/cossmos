import { ShieldCheck } from "lucide-react";

import { useI18n } from "@/contexts/i18n";
import type { SiteInfo } from "@/lib/types";

export function Footer({
  site,
  version,
}: {
  site: SiteInfo;
  version: string;
}) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/60">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        {site.footer && <p>{site.footer}</p>}

        {(site.icp || site.policeIcp) && (
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {site.icp && (
              <a
                href={site.icpLink || "https://beian.miit.gov.cn/"}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {site.icp}
              </a>
            )}
            {site.policeIcp && (
              <a
                href={site.policeIcpLink || "https://beian.mps.gov.cn/"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <ShieldCheck className="size-3" />
                {site.policeIcp}
              </a>
            )}
          </p>
        )}

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            © {year} {site.title}
          </span>
          <span className="opacity-40">·</span>
          <span>{t("footer.poweredBy")}</span>
          {site.github && (
            <>
              <span className="opacity-40">·</span>
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t("footer.source")}
              </a>
            </>
          )}
        </p>

        <p className="opacity-70">
          {site.refreshInterval > 0 && (
            <>{t("footer.autoRefresh", { n: site.refreshInterval })} · </>
          )}
          Cossmos v{version}
        </p>
      </div>
    </footer>
  );
}
