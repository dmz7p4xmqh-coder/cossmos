import * as React from "react";

import { Navbar } from "@/components/Navbar";
import { StatusHero } from "@/components/StatusHero";
import { StatsGrid } from "@/components/StatsGrid";
import {
  Toolbar,
  type ServiceFilter,
  type ServiceSort,
} from "@/components/Toolbar";
import { ServiceGroup } from "@/components/ServiceGroup";
import { Footer } from "@/components/Footer";
import {
  EmptyState,
  ErrorScreen,
  LoadingScreen,
} from "@/components/StateScreens";
import { useStatus } from "@/hooks/use-status";
import { useI18n } from "@/contexts/i18n";
import type { Service } from "@/lib/types";

function matchesFilter(service: Service, filter: ServiceFilter): boolean {
  if (filter === "operational") return service.status === "up";
  if (filter === "issues")
    return service.status === "down" || service.status === "degraded";
  return true;
}

function groupServices(services: Service[]) {
  const groups: { name: string; services: Service[] }[] = [];
  const index = new Map<string, number>();
  for (const s of services) {
    const key = s.group ?? "";
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ name: key, services: [] });
    }
    groups[index.get(key)!].services.push(s);
  }
  return groups;
}

function sortServices(services: Service[], sort: ServiceSort) {
  if (sort === "original") return services;
  const statusRank: Record<Service["status"], number> = {
    down: 0,
    degraded: 1,
    pending: 2,
    up: 3,
  };
  return [...services].sort((a, b) => {
    if (sort === "status") return statusRank[a.status] - statusRank[b.status];
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "uptime") return a.uptime - b.uptime;
    if (sort === "response") return b.responseMs - a.responseMs;
    return (
      new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime()
    );
  });
}

export default function App() {
  const { data, loading, error, refreshing, reload } = useStatus();
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ServiceFilter>("all");
  const [sort, setSort] = React.useState<ServiceSort>("original");
  const [compact, setCompact] = React.useState(false);
  const [, setTick] = React.useState(0);

  // Re-render periodically so relative timestamps stay fresh between polls.
  React.useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Keep the document title in sync with the configured site title.
  React.useEffect(() => {
    if (data?.site.title) document.title = data.site.title;
  }, [data?.site.title]);

  // Use the configured logo as the favicon when provided.
  React.useEffect(() => {
    const logo = data?.site.logo;
    if (!logo) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [data?.site.logo]);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.services.filter((s) => {
      if (!matchesFilter(s, filter)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.url ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.group ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  const sorted = React.useMemo(
    () => sortServices(filtered, sort),
    [filtered, sort],
  );
  const groups = React.useMemo(() => groupServices(sorted), [sorted]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="cossmos-aurora pointer-events-none absolute inset-x-0 top-0 h-64" />

      <Navbar
        title={data?.site.title ?? "Cossmos"}
        github={data?.site.github}
        logo={data?.site.logo}
        logoDark={data?.site.logoDark}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <LoadingScreen />
        ) : error && !data ? (
          <ErrorScreen message={error} onRetry={reload} />
        ) : data ? (
          <div className="space-y-6 sm:space-y-8">
            <StatusHero
              snapshot={data}
              refreshing={refreshing}
              onReload={reload}
            />
            <StatsGrid stats={data.stats} />

            <div className="space-y-5">
              <h2 className="text-base font-semibold sm:text-lg">
                {t("section.services")}
              </h2>
              <Toolbar
                query={query}
                onQueryChange={setQuery}
                filter={filter}
                onFilterChange={setFilter}
                sort={sort}
                onSortChange={setSort}
                compact={compact}
                onCompactChange={setCompact}
              />
              {groups.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-6">
                  {groups.map((g) => (
                    <ServiceGroup
                      key={g.name || "_ungrouped"}
                      name={g.name}
                      services={g.services}
                      compact={compact}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {data && <Footer site={data.site} version={data.version} />}
    </div>
  );
}
