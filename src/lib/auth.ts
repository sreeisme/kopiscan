import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RestaurantRow } from "@/lib/restaurant";

export const ACTIVE_RID_COOKIE = "kopiscan_rid";

export type MemberContext = {
  userId: string;
  email: string;
  role: "owner" | "staff";
  isPlatformAdmin: boolean;
  restaurant: RestaurantRow;
  memberships: { restaurant_id: string; role: "owner" | "staff"; name: string }[];
};

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

/**
 * Resolve the logged-in user's active restaurant + role. Redirects to /login if
 * not signed in. Pass `role: "owner"` for owner-only pages/actions.
 */
export async function requireMember(opts: { role?: "owner" } = {}): Promise<MemberContext> {
  const user = await getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const admin = await isPlatformAdmin(user.id);
  const { data: rows } = await db
    .from("memberships")
    .select("restaurant_id, role, restaurants!inner(id, slug, name, plan, status, theme, settings)")
    .eq("user_id", user.id);

  const memberships = (rows ?? []).map((r) => ({
    restaurant_id: r.restaurant_id as string,
    role: r.role as "owner" | "staff",
    restaurant: r.restaurants as unknown as RestaurantRow,
  }));

  const store = await cookies();
  const wanted = store.get(ACTIVE_RID_COOKIE)?.value;

  let restaurant: RestaurantRow | undefined;
  let role: "owner" | "staff" | undefined;
  const m = memberships.find((x) => x.restaurant_id === wanted) ?? memberships[0];
  if (m) {
    restaurant = m.restaurant;
    role = m.role;
  }
  // Platform admins can "act as" any restaurant they pick in /admin.
  if (admin && wanted && (!m || m.restaurant_id !== wanted)) {
    const { data } = await db.from("restaurants").select("id, slug, name, plan, status, theme, settings").eq("id", wanted).maybeSingle();
    if (data) {
      restaurant = data as RestaurantRow;
      role = "owner";
    }
  }

  if (!restaurant || !role) redirect(admin ? "/admin" : "/login?error=no-restaurant");
  if (opts.role === "owner" && role !== "owner") redirect("/staff");

  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    isPlatformAdmin: admin,
    restaurant,
    memberships: memberships.map((x) => ({ restaurant_id: x.restaurant_id, role: x.role, name: x.restaurant.name })),
  };
}

export async function requirePlatformAdmin() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin(user.id))) redirect("/staff");
  return user;
}

