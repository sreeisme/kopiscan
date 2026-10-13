"use server";

import { z } from "zod";
import { hasFeature } from "@/lib/plans";
import { priceOrder, PricingError, SubmitOrderSchema } from "@/lib/pricing";
import { LIMITS, hitRateLimit } from "@/lib/rate-limit";
import { parseSettings } from "@/lib/restaurant";
import { getActiveSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRestaurantBySlug } from "@/server/diner-data";
import type { ActionResult } from "./result";

/**
 * Diner mutations. Every action follows the same order (see CLAUDE.md):
 * restaurant → table session → zod → rate limit → server-side pricing → write.
 */


const NO_SESSION: ActionResult<never> = {
  ok: false,
  code: "NO_SESSION",
  error: "Your table session has ended. Please scan the QR code on your table again.",
};

async function context(slug: string) {
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return null;
  const session = await getActiveSession(slug);
  if (!session || session.restaurantId !== restaurant.id) return { restaurant, session: null };
  return { restaurant, session };
}

export async function submitOrder(slug: string, input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const ctx = await context(slug);
  if (!ctx) return { ok: false, error: "Restaurant not found." };
  const { restaurant, session } = ctx;
  if (!session) return NO_SESSION;
  if (!parseSettings(restaurant.settings).orderingEnabled)
    return { ok: false, error: "Ordering is paused right now. Please ask our staff for help." };

  const parsed = SubmitOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Your cart looks invalid. Please review it and try again." };
  const { lines, note, idempotencyKey } = parsed.data;

  const db = createAdminClient();

  // Idempotent replay: don't burn rate-limit budget on a double tap.
  const { data: prior } = await db
    .from("orders")
    .select("id")
    .eq("session_id", session.sessionId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (prior) return { ok: true, data: { orderId: prior.id } };

  if (!(await hitRateLimit(`order:s:${session.sessionId}`, LIMITS.orderPerSession)))
    return { ok: false, code: "RATE", error: "You're ordering very quickly. Please wait a few minutes or call a waiter." };
  if (!(await hitRateLimit(`order:t:${session.tableId}`, LIMITS.orderPerTable)))
    return { ok: false, code: "RATE", error: "This table has placed many orders. Please call a waiter." };

  const modifiersEnabled = hasFeature(restaurant.plan, "modifiers");
  const itemIds = Array.from(new Set(lines.map((l) => l.itemId)));
  const [items, groups] = await Promise.all([
    db.from("menu_items").select("id, name, price_cents, available, category_id, menu_categories!inner(visible)").eq("restaurant_id", restaurant.id).in("id", itemIds),
    modifiersEnabled
      ? db.from("modifier_groups").select("id, item_id, name, min_select, max_select").eq("restaurant_id", restaurant.id).in("item_id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);
  const groupIds = (groups.data ?? []).map((g: { id: string }) => g.id);
  const options = groupIds.length
    ? await db.from("modifier_options").select("id, group_id, name, price_delta_cents, available").eq("restaurant_id", restaurant.id).in("group_id", groupIds)
    : { data: [] };

  // Items in hidden categories are not orderable.
  const orderable = (items.data ?? []).filter((i) => (i.menu_categories as unknown as { visible: boolean }).visible);

  let priced;
  try {
    priced = priceOrder(lines, { items: orderable, groups: groups.data ?? [], options: options.data ?? [] }, modifiersEnabled);
  } catch (e) {
    if (e instanceof PricingError) return { ok: false, code: "PRICING", error: e.message };
    throw e;
  }

  const { data: orderId, error } = await db.rpc("place_order", {
    p_order: {
      restaurant_id: restaurant.id,
      table_id: session.tableId,
      session_id: session.sessionId,
      table_label: session.tableLabel,
      subtotal_cents: priced.subtotalCents,
      note: note.trim(),
      idempotency_key: idempotencyKey,
    },
    p_items: priced.lines.map((l) => ({
      item_id: l.itemId,
      name: l.name,
      unit_price_cents: l.unitPriceCents,
      qty: l.qty,
      modifiers: l.modifiers,
      line_total_cents: l.lineTotalCents,
    })),
  });
  if (error || !orderId) {
    console.error("place_order failed", error);
    return { ok: false, error: "We couldn't place your order. Please try again or call a waiter." };
  }
  return { ok: true, data: { orderId: orderId as string } };
}

const RequestTypeSchema = z.enum(["call_waiter", "bill"]);

export async function createServiceRequest(slug: string, type: unknown): Promise<ActionResult> {
  const parsedType = RequestTypeSchema.safeParse(type);
  if (!parsedType.success) return { ok: false, error: "Invalid request." };
  const ctx = await context(slug);
  if (!ctx) return { ok: false, error: "Restaurant not found." };
  const { session } = ctx;
  if (!session) return NO_SESSION;

  const db = createAdminClient();
  const { data: open } = await db
    .from("service_requests")
    .select("id")
    .eq("table_id", session.tableId)
    .eq("type", parsedType.data)
    .eq("status", "open")
    .maybeSingle();
  if (open) return { ok: true, data: undefined }; // already pending — idempotent, no spam

  if (!(await hitRateLimit(`req:${parsedType.data}:s:${session.sessionId}`, LIMITS.requestPerSession)))
    return { ok: false, code: "RATE", error: "We've already let the staff know. Please wait a moment." };
  if (!(await hitRateLimit(`req:t:${session.tableId}`, LIMITS.requestPerTable)))
    return { ok: false, code: "RATE", error: "Staff have been notified several times. They'll be with you shortly." };

  const { error } = await db.from("service_requests").insert({
    restaurant_id: session.restaurantId,
    table_id: session.tableId,
    session_id: session.sessionId,
    table_label: session.tableLabel,
    type: parsedType.data,
  });
  // 23505 = unique violation on "one open request per type per table" → someone just did it
  if (error && error.code !== "23505") return { ok: false, error: "Couldn't reach staff. Please try again." };
  return { ok: true, data: undefined };
}

export type DinerOrderView = {
  id: string;
  status: "new" | "acknowledged" | "done" | "cancelled";
  created_at: string;
  subtotal_cents: number;
  note: string;
  items: { name: string; qty: number; line_total_cents: number; modifiers: { group: string; option: string }[] }[];
};

/** Only orders placed in the caller's own table session are visible. */
export async function getMyOrder(slug: string, orderId: string): Promise<ActionResult<DinerOrderView>> {
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: "Order not found." };
  const ctx = await context(slug);
  if (!ctx) return { ok: false, error: "Restaurant not found." };
  if (!ctx.session) return NO_SESSION;
  const db = createAdminClient();
  const { data } = await db
    .from("orders")
    .select("id, status, created_at, subtotal_cents, note, order_items(name, qty, line_total_cents, modifiers)")
    .eq("id", orderId)
    .eq("session_id", ctx.session.sessionId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Order not found." };
  const { order_items, ...rest } = data;
  return { ok: true, data: { ...rest, items: order_items } as DinerOrderView };
}

/** All orders this session placed — for the "Your orders" list / running bill. */
export async function getMyOrders(slug: string): Promise<ActionResult<DinerOrderView[]>> {
  const ctx = await context(slug);
  if (!ctx) return { ok: false, error: "Restaurant not found." };
  if (!ctx.session) return NO_SESSION;
  const db = createAdminClient();
  const { data } = await db
    .from("orders")
    .select("id, status, created_at, subtotal_cents, note, order_items(name, qty, line_total_cents, modifiers)")
    .eq("session_id", ctx.session.sessionId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(20);
  return {
    ok: true,
    data: (data ?? []).map(({ order_items, ...rest }) => ({ ...rest, items: order_items }) as DinerOrderView),
  };
}
