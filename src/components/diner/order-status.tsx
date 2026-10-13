"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatSgd, taxBreakdown } from "@/lib/pricing";
import { getMyOrder, getMyOrders, type DinerOrderView } from "@/server/actions/diner";
import { ServiceButtons } from "./service-bar";

const STEPS = [
  { key: "new", label: "Sent to kitchen" },
  { key: "acknowledged", label: "Preparing" },
  { key: "done", label: "Served" },
] as const;

function usePoll<T>(fn: () => Promise<T>, ms: number, stop?: (v: T) => boolean) {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const v = await fn().catch(() => null);
      if (!alive) return;
      if (v !== null) setValue(v);
      if (v !== null && stop?.(v)) return;
      timer = setTimeout(tick, document.visibilityState === "visible" ? ms : ms * 3);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function OrderStatus({ slug, orderId, labels }: { slug: string; orderId: string; labels: { callWaiter: string; requestBill: string } }) {
  const res = usePoll(() => getMyOrder(slug, orderId), 8000, (r) => !r.ok || r.data.status === "done" || r.data.status === "cancelled");

  if (!res) return <Wrap slug={slug}><p className="py-10 text-center text-m-muted">Loading your order…</p></Wrap>;
  if (!res.ok) return <Wrap slug={slug}><p className="rounded-m bg-m-surface p-4">{res.error}</p></Wrap>;
  const o = res.data;
  const stepIdx = STEPS.findIndex((s) => s.key === o.status);

  return (
    <Wrap slug={slug}>
      <div className="rounded-m bg-m-surface p-5 text-center">
        <div className="text-4xl">{o.status === "done" ? "🍽️" : o.status === "cancelled" ? "⚠️" : "✅"}</div>
        <h1 className="mt-2 font-m-heading text-2xl font-bold">{o.status === "cancelled" ? "Order cancelled" : "Order received!"}</h1>
        <p className="text-sm text-m-muted">Order #{o.id.slice(0, 6).toUpperCase()}</p>
        {o.status === "cancelled" && <p className="mt-2 text-sm">Please speak to our staff for help.</p>}
      </div>

      {o.status !== "cancelled" && (
        <ol className="flex justify-between gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex flex-1 flex-col items-center gap-1 text-center text-xs">
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                  i <= stepIdx ? "bg-m-primary text-m-on-primary" : "border border-m-muted/40 text-m-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className={i <= stepIdx ? "font-semibold" : "text-m-muted"}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <ItemsList order={o} />
      <ServiceButtons slug={slug} labels={labels} />
      <Link href={`/r/${slug}`} className="block rounded-m bg-m-primary px-4 py-3 text-center font-semibold text-m-on-primary">
        Order more
      </Link>
      <Link href={`/r/${slug}/orders`} className="block text-center text-sm text-m-muted underline">
        All orders at this table
      </Link>
    </Wrap>
  );
}

export function OrdersList({
  slug,
  labels,
  taxSettings,
}: {
  slug: string;
  labels: { callWaiter: string; requestBill: string };
  taxSettings: { serviceChargePct: number; gstPct: number; pricesIncludeTax: boolean };
}) {
  const res = usePoll(() => getMyOrders(slug), 15000);
  if (!res) return <Wrap slug={slug}><p className="py-10 text-center text-m-muted">Loading…</p></Wrap>;
  if (!res.ok) return <Wrap slug={slug}><p className="rounded-m bg-m-surface p-4">{res.error}</p></Wrap>;

  const subtotal = res.data.reduce((s, o) => s + o.subtotal_cents, 0);
  const { serviceCents: service, gstCents: gst } = taxBreakdown(subtotal, taxSettings);

  return (
    <Wrap slug={slug}>
      <h1 className="font-m-heading text-2xl font-bold">Your orders</h1>
      {res.data.length === 0 && <p className="text-m-muted">No orders yet.</p>}
      {res.data.map((o) => (
        <Link key={o.id} href={`/r/${slug}/order/${o.id}`} className="block">
          <ItemsList order={o} showStatus />
        </Link>
      ))}
      {res.data.length > 0 && (
        <div className="space-y-1 rounded-m bg-m-surface p-4 text-sm">
          <Row label="Subtotal" v={subtotal} />
          {service > 0 && <Row label={`Service charge (${taxSettings.serviceChargePct}%)`} v={service} />}
          {gst > 0 && <Row label={`GST (${taxSettings.gstPct}%)`} v={gst} />}
          <div className="flex justify-between pt-1 text-base font-bold">
            <span>Estimated total</span>
            <span>{formatSgd(subtotal + service + gst)}</span>
          </div>
          <p className="pt-1 text-xs text-m-muted">Your final bill is confirmed by our staff.</p>
        </div>
      )}
      <ServiceButtons slug={slug} labels={labels} />
    </Wrap>
  );
}

function Row({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{formatSgd(v)}</span>
    </div>
  );
}

const STATUS_TEXT: Record<DinerOrderView["status"], string> = {
  new: "Sent",
  acknowledged: "Preparing",
  done: "Served",
  cancelled: "Cancelled",
};

function ItemsList({ order, showStatus }: { order: DinerOrderView; showStatus?: boolean }) {
  return (
    <div className="rounded-m bg-m-surface p-4">
      {showStatus && (
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">#{order.id.slice(0, 6).toUpperCase()}</span>
          <span className="text-m-muted">{STATUS_TEXT[order.status]}</span>
        </div>
      )}
      <ul className="space-y-1.5 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-3">
            <span>
              {i.qty}× {i.name}
              {i.modifiers.length > 0 && <span className="block text-m-muted">{i.modifiers.map((m) => m.option).join(", ")}</span>}
            </span>
            <span>{formatSgd(i.line_total_cents)}</span>
          </li>
        ))}
      </ul>
      {order.note && <p className="mt-2 text-sm text-m-muted">Note: {order.note}</p>}
      <div className="mt-2 flex justify-between border-t border-m-muted/20 pt-2 font-semibold">
        <span>Subtotal</span>
        <span>{formatSgd(order.subtotal_cents)}</span>
      </div>
    </div>
  );
}

function Wrap({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl space-y-4 bg-m-bg px-4 py-5 pb-12 font-m-body text-m-text">
      <Link href={`/r/${slug}`} className="text-sm text-m-muted underline">
        ← Back to menu
      </Link>
      {children}
    </div>
  );
}
