import { describe, expect, it } from "vitest";
import { priceOrder, PricingError, SubmitOrderSchema, taxBreakdown, formatSgd } from "@/lib/pricing";

const I1 = "11111111-1111-4111-8111-111111111111";
const I2 = "22222222-2222-4222-8222-222222222222";
const G1 = "33333333-3333-4333-8333-333333333333";
const O1 = "44444444-4444-4444-8444-444444444444";
const O2 = "55555555-5555-4555-8555-555555555555";

const menu = {
  items: [
    { id: I1, name: "Laksa", price_cents: 850, available: true },
    { id: I2, name: "Chendol", price_cents: 400, available: false },
  ],
  groups: [{ id: G1, item_id: I1, name: "Size", min_select: 1, max_select: 1 }],
  options: [
    { id: O1, group_id: G1, name: "Regular", price_delta_cents: 0, available: true },
    { id: O2, group_id: G1, name: "Large", price_delta_cents: 200, available: true },
  ],
};

describe("priceOrder", () => {
  it("computes totals from server prices", () => {
    const r = priceOrder([{ itemId: I1, qty: 2, optionIds: [O2] }], menu, true);
    expect(r.subtotalCents).toBe(2100);
    expect(r.lines[0].modifiers).toEqual([{ group: "Size", option: "Large", priceDeltaCents: 200 }]);
  });

  it("enforces min/max selections", () => {
    expect(() => priceOrder([{ itemId: I1, qty: 1, optionIds: [] }], menu, true)).toThrow(/choose Size/);
    expect(() => priceOrder([{ itemId: I1, qty: 1, optionIds: [O1, O2] }], menu, true)).toThrow(/Too many/);
  });

  it("rejects sold-out, unknown items and foreign options", () => {
    expect(() => priceOrder([{ itemId: I2, qty: 1, optionIds: [] }], menu, true)).toThrow(/sold out/);
    expect(() => priceOrder([{ itemId: O1, qty: 1, optionIds: [] }], menu, true)).toThrow(PricingError);
    expect(() =>
      priceOrder([{ itemId: I1, qty: 1, optionIds: ["66666666-6666-4666-8666-666666666666"] }], menu, true),
    ).toThrow(/Invalid option/);
  });

  it("ignores modifier groups and rejects options when plan lacks modifiers", () => {
    expect(priceOrder([{ itemId: I1, qty: 1, optionIds: [] }], menu, false).subtotalCents).toBe(850);
    expect(() => priceOrder([{ itemId: I1, qty: 1, optionIds: [O2] }], menu, false)).toThrow(PricingError);
  });

  it("schema caps quantities and lines", () => {
    const line = { itemId: I1, qty: 21, optionIds: [] };
    expect(SubmitOrderSchema.safeParse({ lines: [line], idempotencyKey: "abcdefgh" }).success).toBe(false);
    const many = Array.from({ length: 41 }, () => ({ itemId: I1, qty: 1 }));
    expect(SubmitOrderSchema.safeParse({ lines: many, idempotencyKey: "abcdefgh" }).success).toBe(false);
  });
});

describe("taxBreakdown", () => {
  it("applies 10% service then 9% GST", () => {
    expect(taxBreakdown(10000, { serviceChargePct: 10, gstPct: 9, pricesIncludeTax: false })).toEqual({
      subtotalCents: 10000,
      serviceCents: 1000,
      gstCents: 990,
      totalCents: 11990,
    });
  });
  it("is a no-op for nett prices", () => {
    expect(taxBreakdown(500, { serviceChargePct: 10, gstPct: 9, pricesIncludeTax: true }).totalCents).toBe(500);
  });
  it("formats", () => expect(formatSgd(1234)).toBe("S$12.34"));
});
