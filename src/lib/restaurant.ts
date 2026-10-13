import { z } from "zod";
import type { Plan } from "@/lib/plans";

export const SettingsSchema = z.object({
  serviceChargePct: z.number().min(0).max(30).default(0),
  gstPct: z.number().min(0).max(30).default(9),
  pricesIncludeTax: z.boolean().default(true),
  orderingEnabled: z.boolean().default(true),
  timezone: z.string().default("Asia/Singapore"),
});
export type Settings = z.infer<typeof SettingsSchema>;

export function parseSettings(raw: unknown): Settings {
  const r = SettingsSchema.safeParse(raw ?? {});
  return r.success ? r.data : SettingsSchema.parse({});
}

export type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  plan: Plan;
  status: "active" | "trial" | "suspended";
  theme: unknown;
  settings: unknown;
};

export const TZ = "Asia/Singapore";

/** YYYY-MM-DD for "today" in Singapore. */
export function sgToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** UTC ISO range for a Singapore calendar day (SG has no DST, fixed +08:00). */
export function sgDayRange(date: string): { from: string; to: string } {
  const from = new Date(`${date}T00:00:00+08:00`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function formatSgTime(iso: string): string {
  return new Intl.DateTimeFormat("en-SG", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
