import * as React from "react";

export type Lang = "zh" | "en";

const STORAGE_KEY = "cossmos-lang";

type Dict = Record<string, string>;

const messages: Record<Lang, Dict> = {
  zh: {
    "overall.up": "所有系统运行正常",
    "overall.degraded": "部分系统性能下降",
    "overall.down": "部分系统出现故障",
    "overall.pending": "正在获取状态…",
    "status.up": "正常",
    "status.degraded": "降级",
    "status.down": "故障",
    "status.pending": "等待中",
    "stats.total": "服务总数",
    "stats.operational": "正常运行",
    "stats.degraded": "性能降级",
    "stats.down": "发生故障",
    "stats.avgUptime": "平均可用率",
    "section.services": "服务详情",
    "service.uptime": "可用率",
    "service.response": "响应",
    "service.lastChecked": "最近检查",
    "service.history": "最近 {n} 次检查",
    "service.noHistory": "暂无历史数据",
    "search.placeholder": "搜索服务…",
    "filter.all": "全部",
    "filter.operational": "正常",
    "filter.issues": "异常",
    "filter.empty": "没有匹配的服务",
    "sort.label": "排序",
    "sort.original": "原始顺序",
    "sort.status": "按状态",
    "sort.name": "按名称",
    "sort.uptime": "按可用率",
    "sort.response": "按响应",
    "sort.lastChecked": "按检查时间",
    "view.compact": "紧凑视图",
    "updated.label": "更新于",
    "action.refresh": "刷新",
    "action.retry": "重试",
    "error.title": "无法加载状态数据",
    "error.hint": "请确认 status.json 是否可访问，稍后重试。",
    "menu.settings": "设置",
    "menu.theme": "主题",
    "menu.language": "语言",
    "theme.light": "浅色模式",
    "theme.dark": "深色模式",
    "theme.system": "跟随系统",
    "theme.toggle": "切换主题",
    "cert.label": "证书",
    "cert.validUntil": "有效期至 {date}",
    "cert.expiresIn": "{n} 天后到期",
    "cert.expiresToday": "今日到期",
    "cert.expired": "证书已过期",
    "footer.poweredBy": "由 COSS UI + Go 强力驱动",
    "footer.source": "源代码",
    "footer.autoRefresh": "每 {n} 秒自动刷新",
    "footer.icp": "ICP 备案",
    "footer.police": "公安备案",
  },
  en: {
    "overall.up": "All systems operational",
    "overall.degraded": "Degraded performance",
    "overall.down": "Some systems are down",
    "overall.pending": "Fetching status…",
    "status.up": "Operational",
    "status.degraded": "Degraded",
    "status.down": "Down",
    "status.pending": "Pending",
    "stats.total": "Total services",
    "stats.operational": "Operational",
    "stats.degraded": "Degraded",
    "stats.down": "Down",
    "stats.avgUptime": "Avg. uptime",
    "section.services": "Services",
    "service.uptime": "Uptime",
    "service.response": "Response",
    "service.lastChecked": "Last checked",
    "service.history": "Last {n} checks",
    "service.noHistory": "No history yet",
    "search.placeholder": "Search services…",
    "filter.all": "All",
    "filter.operational": "Operational",
    "filter.issues": "Issues",
    "filter.empty": "No services match",
    "sort.label": "Sort",
    "sort.original": "Original order",
    "sort.status": "By status",
    "sort.name": "By name",
    "sort.uptime": "By uptime",
    "sort.response": "By response",
    "sort.lastChecked": "By last checked",
    "view.compact": "Compact view",
    "updated.label": "Updated",
    "action.refresh": "Refresh",
    "action.retry": "Retry",
    "error.title": "Failed to load status data",
    "error.hint": "Make sure status.json is reachable and try again.",
    "menu.settings": "Settings",
    "menu.theme": "Theme",
    "menu.language": "Language",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    "theme.toggle": "Toggle theme",
    "cert.label": "TLS",
    "cert.validUntil": "valid until {date}",
    "cert.expiresIn": "expires in {n}d",
    "cert.expiresToday": "expires today",
    "cert.expired": "certificate expired",
    "footer.poweredBy": "Powered by COSS UI + Go",
    "footer.source": "Source",
    "footer.autoRefresh": "Auto-refreshes every {n}s",
    "footer.icp": "ICP",
    "footer.police": "Public Security",
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function detectLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved === "zh" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(detectLang);

  React.useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = messages[lang][key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
