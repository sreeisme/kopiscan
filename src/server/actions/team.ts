"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACTIVE_RID_COOKIE, getUser, requireMember } from "@/lib/auth";
import { assertLimit } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteOrFindUser } from "@/server/users";
import { check, okVoid, toError, type ActionResult } from "./result";

export async function inviteStaff(emailInput: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const email = z.string().trim().toLowerCase().email().parse(emailInput);
    const db = createAdminClient();
    const { count } = await db
      .from("memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .eq("role", "staff");
    assertLimit(restaurant.plan, "staff", count ?? 0);
    const userId = await inviteOrFindUser(email);
    check(await db.from("memberships").insert({ user_id: userId, restaurant_id: restaurant.id, role: "staff" }));
    revalidatePath("/owner/staff");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function removeMember(userId: string): Promise<ActionResult> {
  try {
    const ctx = await requireMember({ role: "owner" });
    const id = z.string().uuid().parse(userId);
    if (id === ctx.userId) return { ok: false, error: "You can't remove yourself." };
    check(
      await createAdminClient().from("memberships").delete().eq("user_id", id).eq("restaurant_id", ctx.restaurant.id).eq("role", "staff"),
    );
    revalidatePath("/owner/staff");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

/** Switch which restaurant the dashboard shows (multi-restaurant users & platform admins). */
export async function switchRestaurant(restaurantId: string): Promise<void> {
  const id = z.string().uuid().parse(restaurantId);
  const user = await getUser();
  if (!user) return;
  const store = await cookies();
  store.set(ACTIVE_RID_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
