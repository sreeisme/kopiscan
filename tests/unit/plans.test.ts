import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertFeature, assertLimit, hasFeature, LIMITS, minPlanFor, PlanError, PLANS } from "@/lib/plans";

describe("plans", () => {
  it("plan_limits seed in the migration matches LIMITS in plans.ts", () => {
    const sql = readFileSync(path.resolve(__dirname, "../../supabase/migrations/20261006000000_init.sql"), "utf8");
    for (const plan of PLANS) {
      const m = sql.match(new RegExp(`\\('${plan}',\\s*(\\w+),\\s*(\\w+),\\s*(\\w+)\\)`));
      expect(m, `seed row for ${plan}`).toBeTruthy();
      const toNum = (s: string) => (s === "null" ? null : Number(s));
      expect({ tables: toNum(m![1]), items: toNum(m![2]), staff: toNum(m![3]) }).toEqual(LIMITS[plan]);
    }
  });

  it("features are monotonic across tiers", () => {
    for (const f of ["modifiers", "themeAdvanced", "removeBranding", "analytics", "csvExport"] as const) {
      const idx = PLANS.findIndex((p) => hasFeature(p, f));
      expect(idx).toBeGreaterThanOrEqual(0);
      for (const p of PLANS.slice(idx)) expect(hasFeature(p, f)).toBe(true);
    }
  });

  it("gates features", () => {
    expect(() => assertFeature("basic", "modifiers")).toThrow(PlanError);
    expect(() => assertFeature("pro", "modifiers")).not.toThrow();
    expect(() => assertFeature("pro", "analytics")).toThrow(PlanError);
    expect(minPlanFor("analytics")).toBe("premium");
    expect(minPlanFor("modifiers")).toBe("pro");
  });

  it("gates limits", () => {
    expect(() => assertLimit("basic", "tables", 9)).not.toThrow();
    expect(() => assertLimit("basic", "tables", 10)).toThrow(PlanError);
    expect(() => assertLimit("premium", "tables", 10_000)).not.toThrow();
  });
});
