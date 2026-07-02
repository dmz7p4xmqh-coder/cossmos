import type { ReactNode } from "react";
import { Check, Moon, Sun } from "lucide-react";

import { CircleHalf } from "@/components/icons/CircleHalf";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { useTheme, type Theme } from "@/contexts/theme";
import { useI18n } from "@/contexts/i18n";

/**
 * Theme switcher matching the reference: an outline icon button whose glyph
 * reflects the current theme (Sun / Moon / CircleHalf), opening a COSS UI popup
 * menu with the three options and a check on the active one.
 */
export function ThemeMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();

  const triggerIcon =
    theme === "system" ? (
      <CircleHalf className="h-[18px] w-[18px]" />
    ) : resolvedTheme === "dark" ? (
      <Moon className="h-[18px] w-[18px]" />
    ) : (
      <Sun className="h-[18px] w-[18px]" />
    );

  const items: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: "light", label: t("theme.light"), icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: t("theme.dark"), icon: <Moon className="h-4 w-4" /> },
    {
      value: "system",
      label: t("theme.system"),
      icon: <CircleHalf className="h-4 w-4" />,
    },
  ];

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="button-header rounded-lg"
            aria-label={t("theme.toggle")}
          >
            {triggerIcon}
            <span className="sr-only">{t("theme.toggle")}</span>
          </Button>
        }
      />
      <MenuPopup align="end" className="menu-popup-animated min-w-[150px]">
        {items.map((item) => (
          <MenuItem
            key={item.value}
            className="flex items-center gap-2"
            onClick={() => setTheme(item.value)}
          >
            {item.icon}
            {item.label}
            {theme === item.value && <Check className="ml-auto h-4 w-4" />}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
