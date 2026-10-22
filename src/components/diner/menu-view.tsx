"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatSgd } from "@/lib/pricing";
import type { MenuItem } from "@/server/diner-data";
import { useCart } from "./cart";
import { BigCard, GridCard, ListCard } from "./item-card";
import { ItemSheet } from "./item-sheet";
import { ServiceButtons } from "./service-bar";
import type { DinerProps } from "./types";

export function MenuView(props: DinerProps) {
  const { slug, name, theme, menu, logoUrl, coverUrl, imageBase, tableLabel, orderingEnabled, preview } = props;
  const cart = useCart();
  const [open, setOpen] = useState<MenuItem | null>(null);
  const [q, setQ] = useState("");
  const canOrder = !!tableLabel && orderingEnabled;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const cats = menu.filter((c) => c.items.length);
    if (!s) return cats;
    return cats
      .map((c) => ({ ...c, items: c.items.filter((i) => `${i.name} ${i.description} ${i.tags.join(" ")}`.toLowerCase().includes(s)) }))
      .filter((c) => c.items.length);
  }, [menu, q]);

  const Card = theme.layout === "grid" ? GridCard : theme.layout === "cards" ? BigCard : ListCard;
  const listWrap =
    theme.layout === "grid" ? "grid grid-cols-2 gap-3" : theme.layout === "cards" ? "space-y-4" : "divide-y divide-m-muted/20";

  return (
    <div className="min-h-dvh bg-m-bg pb-40 font-m-body text-m-text">
      <header>
        {coverUrl && <img src={coverUrl} alt="" className="h-40 w-full object-cover sm:h-56" />}
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-5">
          {logoUrl && <img src={logoUrl} alt={`${name} logo`} className="size-14 shrink-0 rounded-full bg-m-surface object-cover" />}
          <div className="min-w-0">
            <h1 className="font-m-heading text-2xl font-bold leading-tight">{name}</h1>
            {tableLabel && <p className="text-sm text-m-muted">Table {tableLabel}</p>}
          </div>
        </div>
        {theme.labels.welcome && <p className="mx-auto max-w-2xl px-4 pt-2 text-m-muted">{theme.labels.welcome}</p>}
      </header>

      {!tableLabel && !preview && (
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <p className="rounded-m border border-m-primary bg-m-surface p-3 text-sm">
            Scan the QR code on your table to place an order. You can browse the menu below.
          </p>
        </div>
      )}
      {tableLabel && !orderingEnabled && (
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <p className="rounded-m border border-m-primary bg-m-surface p-3 text-sm">Ordering is paused right now. Please ask our staff for help.</p>
        </div>
      )}

      <nav className="sticky top-0 z-20 mt-4 bg-m-bg/95 backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="w-full rounded-m border border-m-muted/30 bg-m-surface px-4 py-2.5 text-m-text placeholder:text-m-muted focus:border-m-primary focus:outline-none"
          />
          {!q && filtered.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {filtered.map((c) => (
                <a
                  key={c.id}
                  href={`#cat-${c.id}`}
                  className="shrink-0 rounded-m border border-m-muted/30 bg-m-surface px-3 py-1.5 text-sm font-medium"
                >
                  {c.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-2xl space-y-8 px-4 pt-2">
        {filtered.length === 0 && <p className="py-12 text-center text-m-muted">{q ? "No dishes match your search." : "The menu is being prepared."}</p>}
        {filtered.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32">
            <h2 className="mb-2 font-m-heading text-xl font-bold">{c.name}</h2>
            <div className={listWrap}>
              {c.items.map((i) => (
                <Card key={i.id} item={i} theme={theme} imageBase={imageBase} onOpen={() => setOpen(i)} />
              ))}
            </div>
          </section>
        ))}

        {!theme.hideBranding && (
          <p className="pt-6 text-center text-xs text-m-muted">
            Powered by <span className="font-semibold">Kopiscan</span>
          </p>
        )}
      </main>

      {/* Bottom bar */}
      {(tableLabel || preview) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-m-muted/20 bg-m-bg/95 backdrop-blur">
          <div className="mx-auto max-w-2xl space-y-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <ServiceButtons slug={slug} labels={theme.labels} preview={preview} />
            {cart.count > 0 && (
              <Link
                href={preview ? "#" : `/r/${slug}/cart`}
                className="flex items-center justify-between rounded-m bg-m-primary px-4 py-3 font-semibold text-m-on-primary"
              >
                <span>View order · {cart.count}</span>
                <span>{formatSgd(cart.totalCents)}</span>
              </Link>
            )}
            {cart.count === 0 && !preview && (
              <Link href={`/r/${slug}/orders`} className="block text-center text-sm text-m-muted underline">
                Your orders
              </Link>
            )}
          </div>
        </div>
      )}

      {open && <ItemSheet item={open} props={props} canOrder={canOrder || !!preview} onClose={() => setOpen(null)} />}
    </div>
  );
}
