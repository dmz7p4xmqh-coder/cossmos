import { Check, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { useI18n, type Lang } from "@/contexts/i18n";

/** Language switcher built on the same COSS UI popup menu. */
export function LangMenu() {
  const { lang, setLang, t } = useI18n();

  const items: { value: Lang; label: string }[] = [
    { value: "zh", label: "简体中文" },
    { value: "en", label: "English" },
  ];

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="button-header rounded-lg"
            aria-label={t("menu.language")}
          >
            <Languages className="h-[18px] w-[18px]" />
            <span className="sr-only">{t("menu.language")}</span>
          </Button>
        }
      />
      <MenuPopup align="end" className="menu-popup-animated min-w-[150px]">
        {items.map((item) => (
          <MenuItem
            key={item.value}
            className="flex items-center gap-2"
            onClick={() => setLang(item.value)}
          >
            {item.label}
            {lang === item.value && <Check className="ml-auto h-4 w-4" />}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
