import { ServiceCard } from "./ServiceCard";
import type { Service } from "@/lib/types";

export function ServiceGroup({
  name,
  services,
  compact,
}: {
  name: string;
  services: Service[];
  compact?: boolean;
}) {
  return (
    <section className="space-y-3">
      {name && (
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm font-semibold text-muted-foreground">{name}</h2>
          <span className="text-xs text-muted-foreground/70">
            ({services.length})
          </span>
        </div>
      )}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} compact={compact} />
        ))}
      </div>
    </section>
  );
}
