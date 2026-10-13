"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { formatSgd } from "@/lib/pricing";
import { submitOrder } from "@/server/actions/diner";
import { useCart } from "./cart";
import { useToast } from "./toast";

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartView({
  slug,
  tableLabel,
  orderingEnabled,
  placeOrderLabel,
  taxNote,
}: {
  slug: string;
  tableLabel: string | null;
  orderingEnabled: boolean;
  placeOrderLabel: string;
  taxNote: string | null;
}) {
  const cart = useCart();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // one key per cart submission attempt → double taps / retries can't double-order
  const keyRef = useRef<string>(newKey());

  function submit() {
    setError(null);
    start(async () => {
      const r = await submitOrder(slug, {
        lines: cart.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, optionIds: l.optionIds })),
        note: cart.note,
        idempotencyKey: keyRef.current,
      });
      if (r.ok) {
        cart.clear();
        keyRef.current = newKey();
        router.replace(`/r/${slug}/order/${r.data.orderId}`);
      } else {
        // new key so a corrected cart is treated as a fresh attempt
        keyRef.current = newKey();
        setError(r.error);
        toast(r.error, "error");
      }
    });
  }

  if (!tableLabel)
    return (
      <Shell slug={slug}>
        <p className="rounded-m border border-m-primary bg-m-surface p-4">
          Your table session has ended. Please scan the QR code on your table again to order.
        </p>
      </Shell>
    );

  if (cart.lines.length === 0)
    return (
      <Shell slug={slug}>
        <p className="py-10 text-center text-m-muted">Your order is empty.</p>
        <Link href={`/r/${slug}`} className="block rounded-m bg-m-primary px-4 py-3 text-center font-semibold text-m-on-primary">
          Browse the menu
        </Link>
      </Shell>
    );

  return (
    <Shell slug={slug} title={`Your order · Table ${tableLabel}`}>
      <ul className="divide-y divide-m-muted/20 rounded-m bg-m-surface px-4">
        {cart.lines.map((l) => (
          <li key={l.key} className="flex items-start gap-3 py-4">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{l.name}</div>
              {l.optionLabels.length > 0 && <div className="text-sm text-m-muted">{l.optionLabels.join(", ")}</div>}
              <div className="text-sm">{formatSgd(l.unitPriceCents * l.qty)}</div>
            </div>
            <div className="flex items-center rounded-m border border-m-muted/30">
              <button className="px-3 py-1.5" aria-label={`Remove one ${l.name}`} onClick={() => cart.setQty(l.key, l.qty - 1)}>
                −
              </button>
              <span className="w-6 text-center">{l.qty}</span>
              <button className="px-3 py-1.5" aria-label={`Add one ${l.name}`} onClick={() => cart.setQty(l.key, l.qty + 1)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Note for the kitchen (optional)</span>
        <textarea
          value={cart.note}
          maxLength={300}
          onChange={(e) => cart.setNote(e.target.value)}
          rows={2}
          placeholder="e.g. less spicy, no peanuts"
          className="w-full rounded-m border border-m-muted/30 bg-m-surface p-3 text-m-text placeholder:text-m-muted focus:border-m-primary focus:outline-none"
        />
      </label>

      <div className="flex items-center justify-between text-lg font-bold">
        <span>Subtotal</span>
        <span>{formatSgd(cart.totalCents)}</span>
      </div>
      {taxNote && <p className="text-sm text-m-muted">{taxNote}</p>}
      {error && (
        <p role="alert" className="rounded-m border border-m-primary bg-m-surface p-3 text-sm">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={pending || !orderingEnabled}
        className="w-full rounded-m bg-m-primary px-4 py-3.5 text-lg font-semibold text-m-on-primary disabled:opacity-50"
      >
        {!orderingEnabled ? "Ordering is paused" : pending ? "Sending…" : `${placeOrderLabel} · ${formatSgd(cart.totalCents)}`}
      </button>
      <p className="text-center text-xs text-m-muted">Pay at the counter or ask for the bill when you&apos;re done.</p>
    </Shell>
  );
}

function Shell({ slug, title = "Your order", children }: { slug: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl space-y-4 bg-m-bg px-4 py-5 pb-12 font-m-body text-m-text">
      <Link href={`/r/${slug}`} className="text-sm text-m-muted underline">
        ← Back to menu
      </Link>
      <h1 className="font-m-heading text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
