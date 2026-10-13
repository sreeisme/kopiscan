"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSgd } from "@/lib/pricing";
import type { MenuItem } from "@/server/diner-data";
import { useCart } from "./cart";
import { TagList } from "./item-card";
import type { DinerProps } from "./types";

export function ItemSheet({
  item,
  props,
  onClose,
  canOrder,
}: {
  item: MenuItem;
  props: DinerProps;
  onClose: () => void;
  canOrder: boolean;
}) {
  const { theme, imageBase } = props;
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      item.groups.map((g) => {
        // preselect first available option for required single-choice groups
        const first = g.options.find((o) => o.available);
        return [g.id, g.min_select >= 1 && g.max_select === 1 && first ? [first.id] : []];
      }),
    ),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const allOptions = useMemo(() => new Map(item.groups.flatMap((g) => g.options.map((o) => [o.id, { ...o, group: g.name }]))), [item]);
  const chosenIds = Object.values(selected).flat();
  const unit = item.price_cents + chosenIds.reduce((s, id) => s + (allOptions.get(id)?.price_delta_cents ?? 0), 0);
  const missing = item.groups.find((g) => (selected[g.id]?.length ?? 0) < g.min_select);

  function toggle(groupId: string, optionId: string, max: number) {
    setSelected((prev) => {
      const cur = prev[groupId] ?? [];
      if (max === 1) return { ...prev, [groupId]: [optionId] };
      if (cur.includes(optionId)) return { ...prev, [groupId]: cur.filter((x) => x !== optionId) };
      if (cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, optionId] };
    });
  }

  function addToCart() {
    if (missing || !canOrder) return;
    cart.add(
      {
        itemId: item.id,
        name: item.name,
        optionIds: chosenIds,
        optionLabels: chosenIds.map((id) => allOptions.get(id)!.name),
        unitPriceCents: unit,
      },
      qty,
    );
    onClose();
  }

  const img = theme.toggles.showImages && item.image_path ? `${imageBase}/${item.image_path}` : null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={item.name}>
      <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[calc(var(--m-radius)+8px)] bg-m-surface text-m-text sm:rounded-m">
        <div className="overflow-y-auto">
          {img && <img src={img} alt="" className="aspect-[4/3] w-full object-cover" />}
          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-m-heading text-xl font-bold">{item.name}</h2>
              <span className="shrink-0 font-semibold">{formatSgd(item.price_cents)}</span>
            </div>
            {theme.toggles.showTags && <TagList tags={item.tags} />}
            {item.description && <p className="text-m-muted">{item.description}</p>}

            {item.groups.map((g) => (
              <fieldset key={g.id} className="space-y-2 pt-2">
                <legend className="flex w-full items-center justify-between font-semibold">
                  <span>{g.name}</span>
                  <span className="text-xs font-normal text-m-muted">
                    {g.min_select > 0 ? "Required" : "Optional"}
                    {g.max_select > 1 ? ` · up to ${g.max_select}` : ""}
                  </span>
                </legend>
                {g.options.map((o) => {
                  const on = selected[g.id]?.includes(o.id) ?? false;
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-m border px-3 py-2.5 ${
                        on ? "border-m-primary" : "border-m-muted/30"
                      } ${o.available ? "" : "opacity-50"}`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={g.max_select === 1 ? "radio" : "checkbox"}
                          name={g.id}
                          checked={on}
                          disabled={!o.available}
                          onChange={() => toggle(g.id, o.id, g.max_select)}
                          className="size-4 accent-[var(--m-primary)]"
                        />
                        {o.name}
                        {!o.available && <span className="text-xs text-m-muted">(unavailable)</span>}
                      </span>
                      {o.price_delta_cents !== 0 && (
                        <span className="text-sm text-m-muted">
                          {o.price_delta_cents > 0 ? "+" : "−"}
                          {formatSgd(Math.abs(o.price_delta_cents))}
                        </span>
                      )}
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>
        </div>

        {canOrder && item.available && (
          <div className="flex items-center gap-3 border-t border-m-muted/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center rounded-m border border-m-muted/30">
              <button className="px-3 py-2 text-lg" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="w-6 text-center font-semibold" aria-live="polite">
                {qty}
              </span>
              <button className="px-3 py-2 text-lg" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}>
                +
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={!!missing}
              className="flex-1 rounded-m bg-m-primary px-4 py-3 font-semibold text-m-on-primary disabled:opacity-50"
            >
              {missing ? `Choose ${missing.name}` : `${theme.labels.addToCart} · ${formatSgd(unit * qty)}`}
            </button>
          </div>
        )}
        {!item.available && <p className="border-t border-m-muted/20 p-4 text-center font-semibold text-m-muted">Sold out</p>}
      </div>
    </div>
  );
}
