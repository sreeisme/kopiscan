import { MenuEditor } from "@/components/dash/menu-editor";
import { PageHeader } from "@/components/dash/ui";
import { requireMember } from "@/lib/auth";
import { STORAGE_BASE } from "@/lib/env";
import { hasFeature, limitFor } from "@/lib/plans";
import { getMenu } from "@/server/diner-data";

export const metadata = { title: "Menu" };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { restaurant } = await requireMember({ role: "owner" });
  const menu = await getMenu(restaurant, { includeHidden: true });
  const itemCount = menu.reduce((s, c) => s + c.items.length, 0);
  const max = limitFor(restaurant.plan, "items");
  return (
    <>
      <PageHeader
        title="Menu"
        description={`${itemCount}${max ? ` / ${max}` : ""} items. Changes appear on diners' phones immediately.`}
      />
      <MenuEditor
        restaurantId={restaurant.id}
        menu={menu}
        imageBase={STORAGE_BASE}
        modifiersEnabled={hasFeature(restaurant.plan, "modifiers")}
        atItemLimit={max !== null && itemCount >= max}
      />
    </>
  );
}
