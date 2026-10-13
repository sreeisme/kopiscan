import { MenuView } from "@/components/diner/menu-view";
import { STORAGE_BASE, storageUrl } from "@/lib/env";
import { parseSettings } from "@/lib/restaurant";
import { getActiveSession } from "@/lib/session";
import { resolveTheme } from "@/lib/theme/resolve";
import { getMenu, getRestaurantBySlug } from "@/server/diner-data";

export const dynamic = "force-dynamic";

export default async function DinerMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = (await getRestaurantBySlug(slug))!; // layout already 404s
  const [menu, session] = await Promise.all([getMenu(restaurant), getActiveSession(slug)]);
  const theme = resolveTheme(restaurant.theme, restaurant.plan);

  return (
    <MenuView
      slug={slug}
      name={restaurant.name}
      theme={theme}
      menu={menu}
      logoUrl={storageUrl(theme.assets.logoPath)}
      coverUrl={storageUrl(theme.assets.coverPath)}
      imageBase={STORAGE_BASE}
      tableLabel={session?.restaurantId === restaurant.id ? session.tableLabel : null}
      orderingEnabled={parseSettings(restaurant.settings).orderingEnabled}
    />
  );
}
