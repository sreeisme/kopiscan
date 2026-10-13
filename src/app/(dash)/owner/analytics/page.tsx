import { Card, PageHeader, Upsell } from "@/components/dash/ui";
import { requireMember } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { formatSgd } from "@/lib/pricing";
import { sgDayRange, sgToday } from "@/lib/restaurant";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function AnalyticsPage() {
  const { restaurant } = await requireMember({ role: "owner" });
  if (!hasFeature(restaurant.plan, "analytics"))
    return (
      <>
        <PageHeader title="Analytics" />
        <Upsell feature="analytics">See your best-selling dishes, busiest hours and order trends over time.</Upsell>
      </>
    );

  const today = sgToday();
  const start = new Date(new Date(`${today}T00:00:00+08:00`).getTime() - (DAYS - 1) * 86_400_000);
  const { to } = sgDayRange(today);
  const { data } = await createAdminClient()
    .from("orders")
    .select("created_at, acknowledged_at, done_at, subtotal_cents, order_items(name, qty, line_total_cents)")
    .eq("restaurant_id", restaurant.id)
    .neq("status", "cancelled")
    .gte("created_at", start.toISOString())
    .lt("created_at", to)
    .limit(20000);

  type Row = { created_at: string; acknowledged_at: string | null; done_at: string | null; subtotal_cents: number; order_items: { name: string; qty: number; line_total_cents: number }[] };
  const rows = (data ?? []) as Row[];
  const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date(iso));
  const hourOf = (iso: string) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", hour12: false }).format(new Date(iso)));

  const byDay = new Map<string, { orders: number; cents: number }>();
  for (let i = 0; i < DAYS; i++) byDay.set(dayKey(new Date(start.getTime() + i * 86_400_000).toISOString()), { orders: 0, cents: 0 });
  const byHour = new Map<number, number>();
  const items = new Map<string, { qty: number; cents: number }>();
  const prepMins: number[] = [];
  for (const o of rows) {
    const d = byDay.get(dayKey(o.created_at));
    if (d) {
      d.orders++;
      d.cents += o.subtotal_cents;
    }
    byHour.set(hourOf(o.created_at), (byHour.get(hourOf(o.created_at)) ?? 0) + 1);
    for (const i of o.order_items) {
      const c = items.get(i.name) ?? { qty: 0, cents: 0 };
      items.set(i.name, { qty: c.qty + i.qty, cents: c.cents + i.line_total_cents });
    }
    if (o.done_at) prepMins.push((new Date(o.done_at).getTime() - new Date(o.created_at).getTime()) / 60000);
  }
  const gross = rows.reduce((s, o) => s + o.subtotal_cents, 0);
  const topItems = [...items].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const hours = Array.from({ length: 24 }, (_, h) => ({ h, n: byHour.get(h) ?? 0 })).filter((x, _, all) => {
    const active = all.filter((a) => a.n > 0).map((a) => a.h);
    return active.length ? x.h >= Math.min(...active) && x.h <= Math.max(...active) : false;
  });
  const days = [...byDay].map(([d, v]) => ({ d, ...v }));
  const median = prepMins.length ? prepMins.sort((a, b) => a - b)[Math.floor(prepMins.length / 2)] : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description={`Last ${DAYS} days · cancelled orders excluded · amounts before service charge/GST`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders" value={rows.length.toLocaleString("en-SG")} />
        <Stat label="Gross sales" value={formatSgd(gross)} />
        <Stat label="Avg order" value={rows.length ? formatSgd(Math.round(gross / rows.length)) : "—"} />
        <Stat label="Median order → served" value={median === null ? "—" : `${Math.round(median)} min`} />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Orders per day</h2>
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Orders per day, last 30 days">
          {days.map((d) => {
            const max = Math.max(1, ...days.map((x) => x.orders));
            return (
              <div
                key={d.d}
                title={`${d.d}: ${d.orders} orders · ${formatSgd(d.cents)}`}
                className="group flex h-full flex-1 items-end hover:bg-neutral-100"
              >
                <div className="w-full rounded-t bg-neutral-800 group-hover:bg-neutral-600" style={{ height: `${(d.orders / max) * 100}%` }} />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-xs text-neutral-500">
          <span>{days[0]?.d}</span>
          <span>{days.at(-1)?.d}</span>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Top dishes (by quantity)</h2>
          <BarList rows={topItems.map((i) => ({ label: i.name, value: i.qty, detail: formatSgd(i.cents) }))} />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Busiest hours (orders)</h2>
          <BarList rows={hours.map((h) => ({ label: `${String(h.h).padStart(2, "0")}:00`, value: h.n }))} />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}

function BarList({ rows }: { rows: { label: string; value: number; detail?: string }[] }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-neutral-500">No orders yet</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm" title={`${r.label}: ${r.value}${r.detail ? ` · ${r.detail}` : ""}`}>
          <span className="truncate">{r.label}</span>
          <span className="h-3 rounded-r bg-neutral-100">
            <span className="block h-full rounded-r bg-neutral-800" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="min-w-12 text-right tabular-nums text-neutral-700">
            {r.value}
            {r.detail && <span className="text-neutral-500"> · {r.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
