"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { TAGS } from "@/lib/menu-tags";
import { assertFeature, assertLimit } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { check, ok, okVoid, toError, type ActionResult } from "./result";

const Id = z.string().uuid();
const done = (slug: string) => {
  revalidatePath("/owner/menu");
  revalidatePath(`/r/${slug}`);
};

// ---------------------------------------------------------------- categories
const CategoryInput = z.object({ name: z.string().trim().min(1).max(60), visible: z.boolean().default(true) });

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const v = CategoryInput.parse(input);
    const supabase = await createClient();
    const { count } = await supabase.from("menu_categories").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id);
    const { data } = check(
      await supabase.from("menu_categories").insert({ ...v, restaurant_id: restaurant.id, sort: count ?? 0 }).select("id").single(),
    );
    done(restaurant.slug);
    return ok({ id: data!.id });
  } catch (e) {
    return toError(e);
  }
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const v = CategoryInput.partial().parse(input);
    const supabase = await createClient();
    check(await supabase.from("menu_categories").update(v).eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const supabase = await createClient();
    check(await supabase.from("menu_categories").delete().eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

/** Persist a drag/arrow reorder: ids in their new order. */
export async function reorder(table: "menu_categories" | "menu_items", ids: string[]): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const t = z.enum(["menu_categories", "menu_items"]).parse(table);
    const list = z.array(Id).max(500).parse(ids);
    const supabase = await createClient();
    await Promise.all(list.map((id, i) => supabase.from(t).update({ sort: i }).eq("id", id).eq("restaurant_id", restaurant.id).then(check)));
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

// ---------------------------------------------------------------- items
const ItemInput = z.object({
  category_id: Id,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  price_cents: z.number().int().min(0).max(1_000_000),
  image_path: z.string().max(300).nullable().default(null),
  tags: z.array(z.enum(TAGS)).max(9).default([]),
  available: z.boolean().default(true),
});

export async function createItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const v = ItemInput.parse(input);
    const supabase = await createClient();
    const { count } = await supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id);
    assertLimit(restaurant.plan, "items", count ?? 0);
    assertImagePath(restaurant.id, v.image_path);
    const { data } = check(
      await supabase.from("menu_items").insert({ ...v, restaurant_id: restaurant.id, sort: count ?? 0 }).select("id").single(),
    );
    done(restaurant.slug);
    return ok({ id: data!.id });
  } catch (e) {
    return toError(e);
  }
}

export async function updateItem(id: string, input: unknown): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const v = ItemInput.partial().parse(input);
    if (v.image_path !== undefined) assertImagePath(restaurant.id, v.image_path);
    const supabase = await createClient();
    check(await supabase.from("menu_items").update(v).eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

/** Staff can toggle sold-out too (common during service). */
export async function setItemAvailable(id: string, available: boolean): Promise<ActionResult> {
  try {
    const { restaurant, role } = await requireMember();
    const supabase = await createClient();
    if (role === "owner") {
      check(await supabase.from("menu_items").update({ available: !!available }).eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    } else {
      // staff lack RLS write on menu_items; do this one narrow update with the service role
      check(
        await createAdminClient().from("menu_items").update({ available: !!available }).eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id),
      );
    }
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const supabase = await createClient();
    check(await supabase.from("menu_items").delete().eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

function assertImagePath(restaurantId: string, path: string | null | undefined) {
  if (path && !path.startsWith(`${restaurantId}/`)) throw new Error("Invalid image path");
}

// ---------------------------------------------------------------- modifiers (Pro+)
const OptionInput = z.object({
  id: Id.optional(),
  name: z.string().trim().min(1).max(60),
  price_delta_cents: z.number().int().min(-100_000).max(100_000).default(0),
  available: z.boolean().default(true),
});
const GroupInput = z
  .object({
    id: Id.optional(),
    name: z.string().trim().min(1).max(60),
    min_select: z.number().int().min(0).max(20),
    max_select: z.number().int().min(1).max(20),
    options: z.array(OptionInput).min(1).max(20),
  })
  .refine((g) => g.min_select <= g.max_select, "Min must be ≤ max")
  .refine((g) => g.min_select <= g.options.length, "Min is more than the number of options");

/** Replace the full modifier set for an item (simple + consistent). */
export async function saveItemModifiers(itemId: string, groups: unknown): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    assertFeature(restaurant.plan, "modifiers");
    const item = Id.parse(itemId);
    const list = z.array(GroupInput).max(10).parse(groups);
    const supabase = await createClient();
    const { data: owned } = check(await supabase.from("menu_items").select("id").eq("id", item).eq("restaurant_id", restaurant.id).maybeSingle());
    if (!owned) throw new Error("Item not found");

    check(await supabase.from("modifier_groups").delete().eq("item_id", item).eq("restaurant_id", restaurant.id));
    for (const [gi, g] of list.entries()) {
      const { data: grp } = check(
        await supabase
          .from("modifier_groups")
          .insert({ restaurant_id: restaurant.id, item_id: item, name: g.name, min_select: g.min_select, max_select: g.max_select, sort: gi })
          .select("id")
          .single(),
      );
      check(
        await supabase.from("modifier_options").insert(
          g.options.map((o, oi) => ({
            restaurant_id: restaurant.id,
            group_id: grp!.id,
            name: o.name,
            price_delta_cents: o.price_delta_cents,
            available: o.available,
            sort: oi,
          })),
        ),
      );
    }
    done(restaurant.slug);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}
