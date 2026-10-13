import "server-only";
import { cache } from "react";
import { hasFeature } from "@/lib/plans";
import type { RestaurantRow } from "@/lib/restaurant";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public restaurant lookup (service role; diner pages never use the anon client). */
export const getRestaurantBySlug = cache(async (slug: string): Promise<RestaurantRow | null> => {
  if (!/^[a-z0-9-]{3,48}$/.test(slug)) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("restaurants")
    .select("id, slug, name, plan, status, theme, settings")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || data.status === "suspended") return null;
  return data as RestaurantRow;
});

export type MenuOption = { id: string; group_id: string; name: string; price_delta_cents: number; available: boolean; sort: number };
export type MenuGroup = { id: string; item_id: string; name: string; min_select: number; max_select: number; sort: number; options: MenuOption[] };
export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_cents: number;
  image_path: string | null;
  tags: string[];
  available: boolean;
  sort: number;
  groups: MenuGroup[];
};
export type MenuCategory = { id: string; name: string; sort: number; visible: boolean; items: MenuItem[] };

/**
 * Full menu tree. `includeHidden` is for the owner editor; diners only get visible
 * categories. Modifier groups are omitted when the plan doesn't include modifiers.
 */
export async function getMenu(restaurant: Pick<RestaurantRow, "id" | "plan">, opts: { includeHidden?: boolean } = {}) {
  const db = createAdminClient();
  const withMods = hasFeature(restaurant.plan, "modifiers");
  const [cats, items, groups, options] = await Promise.all([
    db.from("menu_categories").select("id, name, sort, visible").eq("restaurant_id", restaurant.id).order("sort").order("name"),
    db
      .from("menu_items")
      .select("id, category_id, name, description, price_cents, image_path, tags, available, sort")
      .eq("restaurant_id", restaurant.id)
      .order("sort")
      .order("name"),
    withMods
      ? db.from("modifier_groups").select("id, item_id, name, min_select, max_select, sort").eq("restaurant_id", restaurant.id).order("sort")
      : Promise.resolve({ data: [] as Omit<MenuGroup, "options">[] }),
    withMods
      ? db.from("modifier_options").select("id, group_id, name, price_delta_cents, available, sort").eq("restaurant_id", restaurant.id).order("sort")
      : Promise.resolve({ data: [] as MenuOption[] }),
  ]);

  const optsByGroup = new Map<string, MenuOption[]>();
  for (const o of (options.data ?? []) as MenuOption[]) optsByGroup.set(o.group_id, [...(optsByGroup.get(o.group_id) ?? []), o]);
  const groupsByItem = new Map<string, MenuGroup[]>();
  for (const g of (groups.data ?? []) as Omit<MenuGroup, "options">[])
    groupsByItem.set(g.item_id, [...(groupsByItem.get(g.item_id) ?? []), { ...g, options: optsByGroup.get(g.id) ?? [] }]);

  const itemsByCat = new Map<string, MenuItem[]>();
  for (const i of (items.data ?? []) as Omit<MenuItem, "groups">[])
    itemsByCat.set(i.category_id, [...(itemsByCat.get(i.category_id) ?? []), { ...i, groups: groupsByItem.get(i.id) ?? [] }]);

  return ((cats.data ?? []) as Omit<MenuCategory, "items">[])
    .filter((c) => opts.includeHidden || c.visible)
    .map((c) => ({ ...c, items: itemsByCat.get(c.id) ?? [] }));
}
