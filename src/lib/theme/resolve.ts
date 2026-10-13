import { hasFeature, type Plan } from "@/lib/plans";
import { DEFAULT_THEME } from "./defaults";
import { ThemeSchema, type Theme } from "./schema";

const RADIUS: Record<Theme["radius"], string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "14px",
  full: "9999px",
};

function deepMerge<T>(base: T, over: unknown): T {
  if (over === undefined) return base;
  if (over === null || typeof over !== "object" || Array.isArray(over)) return over as T;
  if (base === null || typeof base !== "object") return over as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    if (v === undefined) continue;
    const b = out[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" ? deepMerge(b, v) : v;
  }
  return out as T;
}

/** Merge stored (possibly partial) theme over defaults, validating section by section. */
export function mergeTheme(stored: unknown): Theme {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const out = structuredClone(DEFAULT_THEME) as Record<string, unknown>;
  for (const key of Object.keys(ThemeSchema.shape) as (keyof Theme)[]) {
    if (!(key in src)) continue;
    const candidate = deepMerge(DEFAULT_THEME[key], src[key]);
    const ok = ThemeSchema.shape[key].safeParse(candidate);
    if (ok.success) out[key] = ok.data;
  }
  return out as Theme;
}

/**
 * Merge stored theme over defaults, then strip anything the plan doesn't allow.
 * Basic keeps colours/fonts/radius (set via presets + primary colour) and the logo.
 */
export function resolveTheme(stored: unknown, plan: Plan): Theme {
  const theme = mergeTheme(stored);

  if (!hasFeature(plan, "themeAdvanced")) {
    // Basic keeps: whole preset palette/font/radius (presets are allowed), logo, primary colour.
    theme.layout = DEFAULT_THEME.layout;
    theme.assets = { logoPath: theme.assets.logoPath, coverPath: null };
    theme.labels = DEFAULT_THEME.labels;
    theme.toggles = DEFAULT_THEME.toggles;
  }
  if (!hasFeature(plan, "removeBranding")) theme.hideBranding = false;
  return theme;
}

/** CSS custom properties applied on the diner root. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const c = theme.colors;
  return {
    "--m-primary": c.primary,
    "--m-on-primary": c.onPrimary,
    "--m-bg": c.background,
    "--m-surface": c.surface,
    "--m-text": c.text,
    "--m-muted": c.mutedText,
    "--m-accent": c.accent,
    "--m-radius": RADIUS[theme.radius],
    "--m-font-heading": `"${theme.font.heading}", system-ui, sans-serif`,
    "--m-font-body": `"${theme.font.body}", system-ui, sans-serif`,
  };
}

export function googleFontsHref(theme: Theme): string {
  const families = Array.from(new Set([theme.font.heading, theme.font.body]))
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
