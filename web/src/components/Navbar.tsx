import { Activity, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme";
import { ThemeMenu } from "./ThemeMenu";
import { LangMenu } from "./LangMenu";

interface NavbarProps {
  title: string;
  github?: string;
  logo?: string;
  logoDark?: string;
}

export function Navbar({ title, github, logo, logoDark }: NavbarProps) {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" && logoDark ? logoDark : logo;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="size-9 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card shadow-xs">
              <Activity className="size-5" />
            </span>
          )}
          <p className="truncate text-base font-semibold leading-tight sm:text-lg">
            {title}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {github && (
            <Button
              variant="outline"
              size="sm"
              className="button-header hidden rounded-lg sm:inline-flex"
              render={<a href={github} target="_blank" rel="noreferrer" />}
            >
              <Github className="size-4" />
              GitHub
            </Button>
          )}
          <LangMenu />
          <ThemeMenu />
        </div>
      </div>
    </header>
  );
}
