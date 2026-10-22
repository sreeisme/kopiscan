"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatSgd } from "@/lib/pricing";
import { formatSgTime } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/client";
import { setOrderingEnabled } from "@/server/actions/branding";
import { closeTable, resolveRequest, setOrderStatus } from "@/server/actions/staff";
import { btn, cx } from "./ui";

type OrderItem = { id: string; name: string; qty: number; modifiers: { group: string; option: string }[]; line_total_cents: number };
type Order = {
  id: string;
  table_id: string;
  table_label: string;
  status: "new" | "acknowledged" | "done" | "cancelled";
  subtotal_cents: number;
  note: string;
  created_at: string;
  order_items: OrderItem[];
};
type Req = { id: string; table_id: string; table_label: string; type: "call_waiter" | "bill"; status: "open" | "done"; created_at: string };

const ORDER_COLS = "id, table_id, table_label, status, subtotal_cents, note, created_at, order_items(id, name, qty, modifiers, line_total_cents)";

/** Two-tone chime via Web Audio — no audio file to host or fail to load. */
function chime(ctx: AudioContext, urgent = false) {
  const now = ctx.currentTime;
  const notes = urgent ? [880, 660, 880, 660] : [660, 880];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now + i * 0.18);
    g.gain.exponentialRampToValueAtTime(0.5, now + i * 0.18 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
    o.connect(g).connect(ctx.destination);
    o.start(now + i * 0.18);
    o.stop(now + i * 0.18 + 0.17);
  });
}

function ago(iso: string, now: number) {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  return m < 1 ? "just now" : `${m}m ago`;
}

export function StaffBoard({ restaurantId, since, orderingEnabled }: { restaurantId: string; since: string; orderingEnabled: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [live, setLive] = useState<"connecting" | "live" | "offline">("connecting");
  const [shiftOn, setShiftOn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [ordering, setOrdering] = useState(orderingEnabled);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [, start] = useTransition();
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const alert = useCallback((urgent = false) => {
    if (audio.current && audio.current.state === "running") chime(audio.current, urgent);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(200);
  }, []);

  const refresh = useCallback(async () => {
    const [o, r] = await Promise.all([
      supabase.from("orders").select(ORDER_COLS).eq("restaurant_id", restaurantId).gte("created_at", since).order("created_at", { ascending: true }),
      supabase.from("service_requests").select("id, table_id, table_label, type, status, created_at").eq("restaurant_id", restaurantId).eq("status", "open").order("created_at"),
    ]);
    if (o.data) {
      const list = o.data as unknown as Order[];
      // alert for anything we haven't seen (covers missed realtime events)
      const fresh = list.filter((x) => x.status === "new" && !seen.current.has(x.id));
      list.forEach((x) => seen.current.add(x.id));
      if (fresh.length && !firstLoad.current) alert();
      setOrders(list);
    }
    if (r.data) {
      const fresh = (r.data as Req[]).filter((x) => !seen.current.has(x.id));
      r.data.forEach((x: Req) => seen.current.add(x.id));
      if (fresh.length && !firstLoad.current) alert(true);
      setRequests(r.data as Req[]);
    }
    firstLoad.current = false;
  }, [supabase, restaurantId, since, alert]);

  // Realtime + polling fallback
  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`staff-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `restaurant_id=eq.${restaurantId}` }, () => refresh())
      .subscribe((status) => setLive(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED" ? "offline" : "connecting"));
    const poll = setInterval(refresh, 20_000);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [supabase, restaurantId, refresh]);

  // Re-alert every 45s while something is waiting
  const waiting = orders.some((o) => o.status === "new") || requests.length > 0;
  useEffect(() => {
    if (!shiftOn || !waiting) return;
    const t = setInterval(() => alert(requests.length > 0), 45_000);
    return () => clearInterval(t);
  }, [shiftOn, waiting, requests.length, alert]);

  async function startShift() {
    // Browsers only allow sound after a user gesture — this button is that gesture.
    audio.current ??= new AudioContext();
    await audio.current.resume();
    chime(audio.current);
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      if (wl) wakeLock.current = await wl.request("screen");
    } catch {
      /* wake lock unsupported */
    }
    setShiftOn(true);
  }

  function move(id: string, status: Order["status"]) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))); // optimistic
    start(async () => {
      const r = await setOrderStatus(id, status);
      if (!r.ok) refresh();
    });
  }

  function doneRequest(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    start(async () => {
      await resolveRequest(id);
    });
  }

  function clearTable(tableId: string) {
    setRequests((prev) => prev.filter((r) => r.table_id !== tableId));
    start(async () => {
      await closeTable(tableId);
      refresh();
    });
  }

  function toggleOrdering() {
    const next = !ordering;
    setOrdering(next);
    start(async () => {
      const r = await setOrderingEnabled(next);
      if (!r.ok) setOrdering(!next);
    });
  }

  const cols = {
    new: orders.filter((o) => o.status === "new"),
    acknowledged: orders.filter((o) => o.status === "acknowledged"),
    done: orders.filter((o) => o.status === "done").slice(-12).reverse(),
  };

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center gap-3">
        {!shiftOn ? (
          <button onClick={startShift} className={`${btn.primary} m-attention bg-green-700 hover:bg-green-800`}>
            ▶ Start shift (enable sound)
          </button>
        ) : (
          <span className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">Sound on · screen kept awake</span>
        )}
        <span
          className={cx(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            live === "live" ? "bg-green-100 text-green-800" : live === "offline" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-700",
          )}
        >
          {live === "live" ? "● Live" : live === "offline" ? "● Reconnecting (polling every 20s)" : "● Connecting"}
        </span>
        <button onClick={toggleOrdering} className={cx("ml-auto", ordering ? btn.secondary : btn.danger)}>
          {ordering ? "Pause ordering" : "Ordering paused · Resume"}
        </button>
      </div>

      {requests.length > 0 && (
        <section aria-label="Table requests" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className={cx(
                "m-attention flex items-center justify-between gap-3 rounded-xl border-2 p-3",
                r.type === "bill" ? "border-blue-500 bg-blue-50" : "border-red-500 bg-red-50",
              )}
            >
              <div>
                <div className="text-lg font-bold">Table {r.table_label}</div>
                <div className="text-sm font-semibold">{r.type === "bill" ? "Bill requested" : "Calling for staff"}</div>
                <div className="text-xs text-neutral-600">{ago(r.created_at, now)}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button className={btn.primary} onClick={() => doneRequest(r.id)}>
                  Done
                </button>
                {r.type === "bill" && (
                  <button className={btn.secondary} onClick={() => clearTable(r.table_id)} title="Ends the table's session so no more orders can be placed">
                    Paid · clear table
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Column title="New" count={cols.new.length} tone="red">
          {cols.new.map((o) => (
            <OrderCard key={o.id} o={o} now={now} highlight>
              <button className={`${btn.primary} flex-1`} onClick={() => move(o.id, "acknowledged")}>
                Acknowledge
              </button>
              {confirmCancel === o.id ? (
                <>
                  <button className={btn.danger} onClick={() => (move(o.id, "cancelled"), setConfirmCancel(null))}>
                    Confirm cancel
                  </button>
                  <button className={btn.ghost} onClick={() => setConfirmCancel(null)}>
                    Keep
                  </button>
                </>
              ) : (
                <button className={btn.ghost} onClick={() => setConfirmCancel(o.id)}>
                  Cancel
                </button>
              )}
            </OrderCard>
          ))}
        </Column>
        <Column title="Preparing" count={cols.acknowledged.length} tone="amber">
          {cols.acknowledged.map((o) => (
            <OrderCard key={o.id} o={o} now={now}>
              <button className={`${btn.primary} flex-1 bg-green-700 hover:bg-green-800`} onClick={() => move(o.id, "done")}>
                Mark done
              </button>
              <button className={btn.ghost} onClick={() => move(o.id, "new")}>
                Undo
              </button>
            </OrderCard>
          ))}
        </Column>
        <Column title="Done (recent)" count={cols.done.length} tone="green">
          {cols.done.map((o) => (
            <OrderCard key={o.id} o={o} now={now} compact>
              <button className={btn.ghost} onClick={() => move(o.id, "acknowledged")}>
                Undo
              </button>
            </OrderCard>
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, count, tone, children }: { title: string; count: number; tone: "red" | "amber" | "green"; children: React.ReactNode }) {
  const dot = { red: "bg-red-500", amber: "bg-amber-500", green: "bg-green-600" }[tone];
  return (
    <section className="space-y-3 rounded-2xl bg-neutral-100 p-3">
      <h2 className="flex items-center gap-2 px-1 font-semibold">
        <span className={`size-2.5 rounded-full ${dot}`} />
        {title}
        <span className="ml-auto rounded-full bg-white px-2 text-sm">{count}</span>
      </h2>
      {count === 0 && <p className="px-1 py-6 text-center text-sm text-neutral-500">Nothing here</p>}
      {children}
    </section>
  );
}

function OrderCard({
  o,
  now,
  highlight,
  compact,
  children,
}: {
  o: Order;
  now: number;
  highlight?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const mins = Math.floor((now - new Date(o.created_at).getTime()) / 60000);
  return (
    <article className={cx("rounded-xl bg-white p-3 shadow-sm", highlight && "ring-2 ring-red-400", compact && "opacity-75")}>
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xl font-bold">T{o.table_label}</span>
        <span className={cx("text-xs", mins >= 15 && o.status !== "done" ? "font-bold text-red-700" : "text-neutral-500")}>
          {formatSgTime(o.created_at)} · {ago(o.created_at, now)}
        </span>
      </header>
      {!compact && (
        <ul className="space-y-1 text-[15px]">
          {o.order_items.map((i) => (
            <li key={i.id}>
              <span className="font-bold">{i.qty}×</span> {i.name}
              {i.modifiers?.length > 0 && <div className="pl-6 text-sm text-neutral-600">{i.modifiers.map((m) => m.option).join(", ")}</div>}
            </li>
          ))}
        </ul>
      )}
      {o.note && !compact && <p className="mt-2 rounded bg-yellow-50 p-2 text-sm font-medium text-yellow-900">Note: {o.note}</p>}
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
        <span>#{o.id.slice(0, 6).toUpperCase()}</span>
        <span>{formatSgd(o.subtotal_cents)}</span>
      </div>
      <div className="no-print mt-2 flex flex-wrap gap-2">{children}</div>
    </article>
  );
}
