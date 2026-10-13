import { describe, expect, it } from "vitest";
import { checkThemeContrast, contrastRatio } from "@/lib/theme/contrast";
import { DEFAULT_THEME } from "@/lib/theme/defaults";
import { PRESETS } from "@/lib/theme/presets";
import { mergeTheme, resolveTheme, themeToCssVars } from "@/lib/theme/resolve";

describe("theme", () => {
  it("returns defaults for empty / garbage input", () => {
    expect(mergeTheme({})).toEqual(DEFAULT_THEME);
    expect(mergeTheme(null)).toEqual(DEFAULT_THEME);
    expect(mergeTheme("nope")).toEqual(DEFAULT_THEME);
  });

  it("merges partial sections and drops only invalid sections", () => {
    const t = mergeTheme({ colors: { primary: "#000000" }, layout: "grid", radius: "bogus" });
    expect(t.colors.primary).toBe("#000000");
    expect(t.colors.background).toBe(DEFAULT_THEME.colors.background);
    expect(t.layout).toBe("grid");
    expect(t.radius).toBe(DEFAULT_THEME.radius);
  });

  it("strips advanced features on basic", () => {
    const stored = {
      layout: "cards",
      labels: { callWaiter: "Ring" },
      assets: { logoPath: "r/logo.png", coverPath: "r/cover.png" },
      hideBranding: true,
    };
    const basic = resolveTheme(stored, "basic");
    expect(basic.layout).toBe("list");
    expect(basic.labels.callWaiter).toBe("Call waiter");
    expect(basic.assets).toEqual({ logoPath: "r/logo.png", coverPath: null });
    expect(basic.hideBranding).toBe(false);

    const pro = resolveTheme(stored, "pro");
    expect(pro.layout).toBe("cards");
    expect(pro.labels.callWaiter).toBe("Ring");
    expect(pro.hideBranding).toBe(false);

    expect(resolveTheme(stored, "premium").hideBranding).toBe(true);
  });

  it("emits css vars", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    expect(vars["--m-primary"]).toBe(DEFAULT_THEME.colors.primary);
    expect(vars["--m-radius"]).toBe("14px");
  });

  it("contrast math matches WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });

  it("all presets and defaults pass contrast checks", () => {
    expect(checkThemeContrast(DEFAULT_THEME.colors)).toEqual([]);
    for (const p of PRESETS) expect(checkThemeContrast(p.colors), p.name).toEqual([]);
  });

  it("flags unreadable combos", () => {
    const issues = checkThemeContrast({ ...DEFAULT_THEME.colors, text: "#EEEEEE" });
    expect(issues.map((i) => i.pair)).toContain("Text on background");
  });
});
