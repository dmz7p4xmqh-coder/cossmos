import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/i18n";
import { cn } from "@/lib/utils";
import { ServiceCard } from "./ServiceCard";
import type { Service } from "@/lib/types";

export function ServiceGroup({
  name,
  services,
  compact,
  collapsed,
  onToggle,
}: {
  name: string;
  services: Service[];
  compact?: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const title = name || t("group.ungrouped");

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          aria-expanded={!collapsed}
          className="flex min-w-0 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          type="button"
          onClick={onToggle}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              collapsed && "-rotate-90",
            )}
          />
          <h2 className="truncate text-sm font-semibold text-muted-foreground">
            {title}
          </h2>
          <span className="text-xs text-muted-foreground/70">
            ({services.length})
          </span>
        </button>
        <Button size="xs" variant="outline" onClick={onToggle}>
          {collapsed ? t("group.expand") : t("group.collapse")}
        </Button>
      </div>
      {!collapsed && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} compact={compact} />
          ))}
        </div>
      )}
    </section>
  );
}
