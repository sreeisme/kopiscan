import { OrdersList } from "@/components/diner/order-status";
import { parseSettings } from "@/lib/restaurant";
import { resolveTheme } from "@/lib/theme/resolve";
import { getRestaurantBySlug } from "@/server/diner-data";

export const metadata = { title: "Your orders" };

export default async function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = (await getRestaurantBySlug(slug))!;
  const theme = resolveTheme(restaurant.theme, restaurant.plan);
  const s = parseSettings(restaurant.settings);
  return (
    <OrdersList
      slug={slug}
      labels={theme.labels}
      taxSettings={{ serviceChargePct: s.serviceChargePct, gstPct: s.gstPct, pricesIncludeTax: s.pricesIncludeTax }}
    />
  );
}
