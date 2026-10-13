import { Card, PageHeader, Upsell, btn, input } from "@/components/dash/ui";
import { PrintButton } from "@/components/dash/print-button";
import { requireMember } from "@/lib/auth";
import { hasFeature, SUMMARY_HISTORY_DAYS } from "@/lib/plans";
import { formatSgd } from "@/lib/pricing";
import { formatSgTime, sgToday } from "@/lib/restaurant";
import { allowedDate, getDaySummary } from "@/server/summary";

export const metadata = { title: "Daily summary" };
export const dynamic = "force-dynamic";

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { restaurant } = await requireMember();
  const sp = await searchParams;
  const today = sgToday();
  const date = allowedDate(restaurant.plan, sp.date);
  const history = SUMMARY_HISTORY_DAYS[restaurant.plan];

  if (!date)
    return (
      <div className="space-y-4">
        <PageHeader title="Daily summary" />
        <Upsell feature="summaryHistory">
          Your plan shows {history === 0 ? "today only" : `the last ${history} days`}.
        </Upsell>
      </div>
    );

  const s = await getDaySummary(restaurant.id, date);
  const minDate = history === null ? undefined : new Date(new Date(today).getTime() - history * 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Daily summary · ${new Date(`${date}T12:00:00+08:00`).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`}
        description={restaurant.name}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            {history !== 0 && (
              <form className="flex gap-2">
                <input type="date" name="date" defaultValue={date} max={today} min={minDate} className={input} />
                <button className={btn.secondary}>Go</button>
              </form>
            )}
            {hasFeature(restaurant.plan, "csvExport") && (
              <a className={btn.secondary} href={`/staff/summary/csv?date=${date}`}>
                Export CSV
              </a>
            )}
            <PrintButton />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={String(s.orderCount)} />
        <Stat label="Gross (before tax)" value={formatSgd(s.grossCents)} />
        <Stat label="Avg order" value={formatSgd(s.avgOrderCents)} />
        <Stat label="Cancelled" value={String(s.cancelledCount)} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Items sold</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-1">Item</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-right">Sales</th>
              </tr>
            </thead>
            <tbody>
              {s.byItem.map((i) => (
                <tr key={i.name} className="border-t border-neutral-100">
                  <td className="py-1.5">{i.name}</td>
                  <td className="py-1.5 text-right font-semibold">{i.qty}</td>
                  <td className="py-1.5 text-right">{formatSgd(i.cents)}</td>
                </tr>
              ))}
              {s.byItem.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-neutral-500">
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">By table</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-1">Table</th>
                <th className="py-1 text-right">Orders</th>
                <th className="py-1 text-right">Sales</th>
              </tr>
            </thead>
            <tbody>
              {s.byTable.map((t) => (
                <tr key={t.label} className="border-t border-neutral-100">
                  <td className="py-1.5">{t.label}</td>
                  <td className="py-1.5 text-right">{t.orders}</td>
                  <td className="py-1.5 text-right">{formatSgd(t.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">All orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-1 pr-3">Time</th>
                <th className="py-1 pr-3">Table</th>
                <th className="py-1 pr-3">Items</th>
                <th className="py-1 pr-3">Status</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {s.orders.map((o) => (
                <tr key={o.id} className={`border-t border-neutral-100 align-top ${o.status === "cancelled" ? "text-neutral-400 line-through" : ""}`}>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatSgTime(o.created_at)}</td>
                  <td className="py-1.5 pr-3">{o.table_label}</td>
                  <td className="py-1.5 pr-3">{o.items}</td>
                  <td className="py-1.5 pr-3 capitalize">{o.status}</td>
                  <td className="py-1.5 text-right">{formatSgd(o.subtotal_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </Card>
  );
}
