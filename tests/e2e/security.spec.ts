import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { anonDb, fixture, OWNER, PASSWORD, serviceDb, STAFF } from "./fixture";

/** Database-level guarantees (RLS, grants, plan triggers). These don't need the browser. */

async function userDb(email: string) {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return db;
}

test("anon key cannot read or write any table", async () => {
  const db = anonDb();
  for (const t of ["restaurants", "menu_items", "tables", "orders", "table_sessions", "service_requests"]) {
    const { data } = await db.from(t).select("*").limit(1);
    expect(data ?? [], t).toHaveLength(0);
  }
  const { error } = await db.from("orders").insert({ restaurant_id: fixture().pro.restaurantId });
  expect(error).not.toBeNull();
  const rpc = await db.rpc("hit_rate_limit", { p_key: "x", p_limit: 1, p_window_secs: 60 });
  expect(rpc.error).not.toBeNull();
});

test("staff cannot see another restaurant's data or edit the menu", async () => {
  const { pro, basic } = fixture();
  const db = await userDb(STAFF);
  const { data: other } = await db.from("tables").select("id").eq("restaurant_id", basic.restaurantId);
  expect(other).toHaveLength(0);
  const { data: own } = await db.from("tables").select("id").eq("restaurant_id", pro.restaurantId);
  expect(own!.length).toBeGreaterThan(0);

  const { data: updated } = await db.from("menu_items").update({ price_cents: 1 }).eq("restaurant_id", pro.restaurantId).select("id");
  expect(updated ?? []).toHaveLength(0);
});

test("owners cannot change their own plan or totals of orders", async () => {
  const { pro } = fixture();
  const db = await userDb(OWNER);
  const plan = await db.from("restaurants").update({ plan: "premium" }).eq("id", pro.restaurantId);
  expect(plan.error).not.toBeNull();
  const total = await db.from("orders").update({ subtotal_cents: 0 }).eq("restaurant_id", pro.restaurantId);
  expect(total.error).not.toBeNull();
});

test("plan limit trigger blocks an 11th table on Basic", async () => {
  const { basic } = fixture();
  const { error } = await serviceDb().from("tables").insert({ restaurant_id: basic.restaurantId, label: "11" });
  expect(error?.message).toContain("PLAN_LIMIT");
});

test("rate limiter allows N then blocks", async () => {
  const db = serviceDb();
  const key = `e2e:${Date.now()}`;
  const results = [];
  for (let i = 0; i < 4; i++) results.push((await db.rpc("hit_rate_limit", { p_key: key, p_limit: 3, p_window_secs: 60 })).data);
  expect(results).toEqual([true, true, true, false]);
});
