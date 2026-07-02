import type { Lang } from "@/contexts/i18n";

/** formatMs renders a response time, switching to seconds past 1000ms. */
export function formatMs(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** formatPercent renders an uptime percentage with at most one decimal. */
export function formatPercent(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

/** formatDateTime renders an absolute, locale-aware timestamp. */
export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** formatDate renders a locale-aware date (no time). */
export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** certDaysLeft returns whole days until the given timestamp (negative if past). */
export function certDaysLeft(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.ceil((t - Date.now()) / 86_400_000);
}

/** relativeTime renders a short "x ago" string in the active language. */
export function relativeTime(iso: string, lang: Lang): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - d) / 1000));
  const zh = lang === "zh";
  if (sec < 5) return zh ? "刚刚" : "just now";
  if (sec < 60) return zh ? `${sec} 秒前` : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return zh ? `${min} 分钟前` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return zh ? `${hr} 小时前` : `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return zh ? `${day} 天前` : `${day}d ago`;
}
