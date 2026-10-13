/** WCAG 2.x relative luminance & contrast ratio. */
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastIssue = { pair: string; ratio: number; min: number };

/** Pairs that must be readable. Body text 4.5:1, muted/large text 3:1. */
export function checkThemeContrast(colors: {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
}): ContrastIssue[] {
  const checks: [string, string, string, number][] = [
    ["Text on background", colors.text, colors.background, 4.5],
    ["Text on surface", colors.text, colors.surface, 4.5],
    ["Button text on primary", colors.onPrimary, colors.primary, 4.5],
    ["Muted text on surface", colors.mutedText, colors.surface, 3],
    ["Muted text on background", colors.mutedText, colors.background, 3],
  ];
  return checks
    .map(([pair, fg, bg, min]) => ({ pair, ratio: Math.round(contrastRatio(fg, bg) * 100) / 100, min }))
    .filter((c) => c.ratio < c.min);
}
