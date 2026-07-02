import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/i18n";
import { cn } from "@/lib/utils";

export type ServiceFilter = "all" | "operational" | "issues";

const filters: ServiceFilter[] = ["all", "operational", "issues"];
const labelKey: Record<ServiceFilter, string> = {
  all: "filter.all",
  operational: "filter.operational",
  issues: "filter.issues",
};

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filter: ServiceFilter;
  onFilterChange: (filter: ServiceFilter) => void;
}

export function Toolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: ToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("search.placeholder")}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex items-center gap-1.5">
        {filters.map((f) => (
          <Button
            key={f}
            variant="outline"
            size="sm"
            onClick={() => onFilterChange(f)}
            aria-pressed={filter === f}
            className={cn(
              filter === f && "border-ring bg-accent text-accent-foreground",
            )}
          >
            {t(labelKey[f])}
          </Button>
        ))}
      </div>
    </div>
  );
}
