/**
 * Single source of truth for tiers. `plan_limits` in the DB mirrors LIMITS
 * (tests/unit/plans.test.ts asserts parity with the migration).
 */
export const PLANS = ["basic", "pro", "premium"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_INFO: Record<Plan, { name: string; priceSgd: number }> = {
  basic: { name: "Basic", priceSgd: 39 },
  pro: { name: "Pro", priceSgd: 89 },
  premium: { name: "Premium", priceSgd: 159 },
};

export type LimitKey = "tables" | "items" | "staff";
/** null = unlimited */
export const LIMITS: Record<Plan, Record<LimitKey, number | null>> = {
  basic: { tables: 10, items: 60, staff: 2 },
  pro: { tables: 30, items: 250, staff: 5 },
  premium: { tables: null, items: null, staff: 15 },
};

export type Feature =
  | "modifiers"
  | "summaryHistory" // view past days' summaries
  | "csvExport"
  | "themeAdvanced" // full palette, fonts, layout, cover, labels
  | "removeBranding"
  | "brandedQr"
  | "analytics";

const FEATURES: Record<Plan, ReadonlySet<Feature>> = {
  basic: new Set([]),
  pro: new Set(["modifiers", "summaryHistory", "themeAdvanced"]),
  premium: new Set([
    "modifiers",
    "summaryHistory",
    "csvExport",
    "themeAdvanced",
    "removeBranding",
    "brandedQr",
    "analytics",
  ]),
};

/** Days of summary history visible; null = unlimited */
export const SUMMARY_HISTORY_DAYS: Record<Plan, number | null> = {
  basic: 0,
  pro: 30,
  premium: null,
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return FEATURES[plan].has(feature);
}

export function limitFor(plan: Plan, key: LimitKey): number | null {
  return LIMITS[plan][key];
}

export class PlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanError";
  }
}

export function assertFeature(plan: Plan, feature: Feature): void {
  if (!hasFeature(plan, feature)) {
    throw new PlanError(`Your ${PLAN_INFO[plan].name} plan does not include this feature. Upgrade to unlock it.`);
  }
}

/** Throws if adding one more would exceed the limit. */
export function assertLimit(plan: Plan, key: LimitKey, currentCount: number): void {
  const lim = limitFor(plan, key);
  if (lim !== null && currentCount >= lim) {
    throw new PlanError(`Your ${PLAN_INFO[plan].name} plan allows up to ${lim} ${key}. Upgrade to add more.`);
  }
}

/** Lowest plan that includes a feature — used for upsell copy. */
export function minPlanFor(feature: Feature): Plan {
  return PLANS.find((p) => hasFeature(p, feature)) ?? "premium";
}
