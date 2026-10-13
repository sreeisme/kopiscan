"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { check, okVoid, toError, type ActionResult } from "./result";
import { inviteOrFindUser } from "@/server/users";

const CreateInput = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/, "3–48 chars: lowercase letters, numbers, hyphens"),
  plan: z.enum(PLANS),
  ownerEmail: z.string().trim().toLowerCase().email(),
});

export async function createRestaurant(input: unknown): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
    const v = CreateInput.parse(input);
    const db = createAdminClient();
    const { data: r } = check(await db.from("restaurants").insert({ name: v.name, slug: v.slug, plan: v.plan }).select("id").single());
    try {
      const userId = await inviteOrFindUser(v.ownerEmail);
      check(await db.from("memberships").insert({ user_id: userId, restaurant_id: r!.id, role: "owner" }));
    } catch (e) {
      await db.from("restaurants").delete().eq("id", r!.id); // roll back
      throw e;
    }
    revalidatePath("/admin");
    return okVoid;
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
    return toError(e);
  }
}

export async function setRestaurantPlan(id: string, plan: string): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
    check(await createAdminClient().from("restaurants").update({ plan: z.enum(PLANS).parse(plan) }).eq("id", z.string().uuid().parse(id)));
    revalidatePath("/admin");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function setRestaurantStatus(id: string, status: string): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
    const s = z.enum(["active", "trial", "suspended"]).parse(status);
    check(await createAdminClient().from("restaurants").update({ status: s }).eq("id", z.string().uuid().parse(id)));
    revalidatePath("/admin");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}
