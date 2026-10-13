import "server-only";
import { SUMMARY_HISTORY_DAYS, type Plan } from "@/lib/plans";
import { sgDayRange, sgToday } from "@/lib/restaurant";
import { createAdminClient } from "@/lib/supabase/admin";

export type DaySummary = {
  date: string;
  orderCount: number;
  cancelledCount: number;
  grossCents: number;
  avgOrderCents: number;
  byItem: { name: string; qty: number; cents: number }[];
  byTable: { label: string; orders: number; cents: number }[];
  byHour: { hour: number; orders: number }[];
  orders: { id: string; table_label: string; created_at: string; status: string; subtotal_cents: number; items: string }[];
};

/** Clamp a requested date to what the plan allows. Returns null if disallowed. */
export function allowedDate(plan: Plan, requested: string | undefined): string | null {
  const today = sgToday();
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;
  if (date > today) return null;
  const days = SUMMARY_HISTORY_DAYS[plan];
  if (days === null) return date;
  const diff = (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000;
  return diff <= days ? date : null;
}

export async function getDaySummary(restaurantId: string, date: string): Promise<DaySummary> {
  const { from, to } = sgDayRange(date);
  const db = createAdminClient();
  const { data } = await db
    .from("orders")
    .select("id, table_label, created_at, status, subtotal_cents, order_items(name, qty, line_total_cents, modifiers)")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", from)
    .lt("created_at", to)
    .order("created_at");

  type Row = {
    id: string;
    table_label: string;
    created_at: string;
    status: string;
    subtotal_cents: number;
    order_items: { name: string; qty: number; line_total_cents: number; modifiers: { option: string }[] }[];
  };
  const rows = (data ?? []) as Row[];
  const valid = rows.filter((r) => r.status !== "cancelled");

  const items = new Map<string, { qty: number; cents: number }>();
  const tables = new Map<string, { orders: number; cents: number }>();
  const hours = new Map<number, number>();
  for (const o of valid) {
    const t = tables.get(o.table_label) ?? { orders: 0, cents: 0 };
    tables.set(o.table_label, { orders: t.orders + 1, cents: t.cents + o.subtotal_cents });
    const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", hour12: false }).format(new Date(o.created_at)));
    hours.set(h, (hours.get(h) ?? 0) + 1);
    for (const i of o.order_items) {
      const cur = items.get(i.name) ?? { qty: 0, cents: 0 };
      items.set(i.name, { qty: cur.qty + i.qty, cents: cur.cents + i.line_total_cents });
    }
  }
  const gross = valid.reduce((s, o) => s + o.subtotal_cents, 0);

  return {
    date,
    orderCount: valid.length,
    cancelledCount: rows.length - valid.length,
    grossCents: gross,
    avgOrderCents: valid.length ? Math.round(gross / valid.length) : 0,
    byItem: [...items].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty),
    byTable: [...tables].map(([label, v]) => ({ label, ...v })).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    byHour: [...hours].map(([hour, orders]) => ({ hour, orders })).sort((a, b) => a.hour - b.hour),
    orders: rows.map((o) => ({
      id: o.id,
      table_label: o.table_label,
      created_at: o.created_at,
      status: o.status,
      subtotal_cents: o.subtotal_cents,
      items: o.order_items.map((i) => `${i.qty}x ${i.name}${i.modifiers?.length ? ` (${i.modifiers.map((m) => m.option).join(", ")})` : ""}`).join("; "),
    })),
  };
}
