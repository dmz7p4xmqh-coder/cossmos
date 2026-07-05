import { Check, LayoutList, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/contexts/i18n";
import { cn } from "@/lib/utils";

export type ServiceFilter = "all" | "operational" | "issues";
export type ServiceSort =
  | "original"
  | "status"
  | "name"
  | "uptime"
  | "response"
  | "lastChecked";

const filters: ServiceFilter[] = ["all", "operational", "issues"];
const labelKey: Record<ServiceFilter, string> = {
  all: "filter.all",
  operational: "filter.operational",
  issues: "filter.issues",
};

const sortOptions: ServiceSort[] = [
  "original",
  "status",
  "name",
  "uptime",
  "response",
  "lastChecked",
];

const sortLabelKey: Record<ServiceSort, string> = {
  original: "sort.original",
  status: "sort.status",
  name: "sort.name",
  uptime: "sort.uptime",
  response: "sort.response",
  lastChecked: "sort.lastChecked",
};

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filter: ServiceFilter;
  onFilterChange: (filter: ServiceFilter) => void;
  sort: ServiceSort;
  onSortChange: (sort: ServiceSort) => void;
  compact: boolean;
  onCompactChange: (compact: boolean) => void;
}

export function Toolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  compact,
  onCompactChange,
}: ToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
      <div className="flex flex-wrap items-center gap-1.5">
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

        <Menu>
          <MenuTrigger
            render={
              <Button variant="outline" size="sm" aria-label={t("sort.label")}>
                <SlidersHorizontal className="size-4" />
                {t(sortLabelKey[sort])}
              </Button>
            }
          />
          <MenuPopup align="end" className="menu-popup-animated min-w-[170px]">
            {sortOptions.map((option) => (
              <MenuItem key={option} onClick={() => onSortChange(option)}>
                {t(sortLabelKey[option])}
                {sort === option && <Check className="ml-auto size-4" />}
              </MenuItem>
            ))}
          </MenuPopup>
        </Menu>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onCompactChange(!compact)}
                aria-label={t("view.compact")}
                aria-pressed={compact}
                className={cn(
                  compact && "border-ring bg-accent text-accent-foreground",
                )}
              >
                <LayoutList className="size-4" />
              </Button>
            }
          />
          <TooltipPopup>{t("view.compact")}</TooltipPopup>
        </Tooltip>
      </div>
    </div>
  );
}
