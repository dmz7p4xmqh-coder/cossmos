import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/status";
import type { Status } from "@/lib/types";

const sizes = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
} as const;

interface StatusDotProps {
  status: Status;
  pulse?: boolean;
  size?: keyof typeof sizes;
  className?: string;
}

/** A solid status dot with an optional animated halo for non-operational states. */
export function StatusDot({
  status,
  pulse,
  size = "md",
  className,
}: StatusDotProps) {
  const meta = statusMeta[status];
  return (
    <span className={cn("relative flex shrink-0", sizes[size], className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            meta.dot,
          )}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", sizes[size], meta.dot)}
      />
    </span>
  );
}
