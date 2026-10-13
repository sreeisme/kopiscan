import { z } from "zod";

export const MAX_QTY_PER_LINE = 20;
export const MAX_LINES = 40;

export const CartLineSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
  optionIds: z.array(z.string().uuid()).max(30).default([]),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const SubmitOrderSchema = z.object({
  lines: z.array(CartLineSchema).min(1).max(MAX_LINES),
  note: z.string().max(300).default(""),
  idempotencyKey: z.string().min(8).max(64),
});

export type PricedItem = { id: string; name: string; price_cents: number; available: boolean };
export type PricedGroup = { id: string; item_id: string; name: string; min_select: number; max_select: number };
export type PricedOption = { id: string; group_id: string; name: string; price_delta_cents: number; available: boolean };

export type PricedLine = {
  itemId: string;
  name: string;
  qty: number;
  unitPriceCents: number;
  modifiers: { group: string; option: string; priceDeltaCents: number }[];
  lineTotalCents: number;
};

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/**
 * Server-side source of truth for order totals. Never trust client prices.
 * `modifiersEnabled` = plan allows modifiers; if false any optionIds are rejected.
 */
export function priceOrder(
  lines: CartLine[],
  menu: { items: PricedItem[]; groups: PricedGroup[]; options: PricedOption[] },
  modifiersEnabled: boolean,
): { lines: PricedLine[]; subtotalCents: number } {
  const items = new Map(menu.items.map((i) => [i.id, i]));
  const groupsByItem = new Map<string, PricedGroup[]>();
  for (const g of menu.groups) groupsByItem.set(g.item_id, [...(groupsByItem.get(g.item_id) ?? []), g]);
  const options = new Map(menu.options.map((o) => [o.id, o]));

  const priced = lines.map((line) => {
    const item = items.get(line.itemId);
    if (!item) throw new PricingError("An item in your cart is no longer on the menu.");
    if (!item.available) throw new PricingError(`${item.name} is sold out.`);

    const groups = modifiersEnabled ? (groupsByItem.get(item.id) ?? []) : [];
    const groupIds = new Set(groups.map((g) => g.id));
    const uniqueOptionIds = Array.from(new Set(line.optionIds));
    if (!modifiersEnabled && uniqueOptionIds.length) throw new PricingError("Options are not available.");

    const chosen = uniqueOptionIds.map((id) => {
      const opt = options.get(id);
      if (!opt || !groupIds.has(opt.group_id)) throw new PricingError(`Invalid option for ${item.name}.`);
      if (!opt.available) throw new PricingError(`${opt.name} is unavailable.`);
      return opt;
    });

    for (const g of groups) {
      const n = chosen.filter((o) => o.group_id === g.id).length;
      if (n < g.min_select) throw new PricingError(`Please choose ${g.name} for ${item.name}.`);
      if (n > g.max_select) throw new PricingError(`Too many choices for ${g.name} on ${item.name}.`);
    }

    const groupName = new Map(groups.map((g) => [g.id, g.name]));
    const modifiers = chosen.map((o) => ({
      group: groupName.get(o.group_id)!,
      option: o.name,
      priceDeltaCents: o.price_delta_cents,
    }));
    const unitPriceCents = Math.max(0, item.price_cents + modifiers.reduce((s, m) => s + m.priceDeltaCents, 0));
    return {
      itemId: item.id,
      name: item.name,
      qty: line.qty,
      unitPriceCents,
      modifiers,
      lineTotalCents: unitPriceCents * line.qty,
    };
  });

  return { lines: priced, subtotalCents: priced.reduce((s, l) => s + l.lineTotalCents, 0) };
}

export function formatSgd(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}

/** Display-only breakdown for the bill/summary. Rounds each component to the cent. */
export function taxBreakdown(
  subtotalCents: number,
  settings: { serviceChargePct: number; gstPct: number; pricesIncludeTax: boolean },
) {
  if (settings.pricesIncludeTax) return { subtotalCents, serviceCents: 0, gstCents: 0, totalCents: subtotalCents };
  const serviceCents = Math.round((subtotalCents * settings.serviceChargePct) / 100);
  const gstCents = Math.round(((subtotalCents + serviceCents) * settings.gstPct) / 100);
  return { subtotalCents, serviceCents, gstCents, totalCents: subtotalCents + serviceCents + gstCents };
}
