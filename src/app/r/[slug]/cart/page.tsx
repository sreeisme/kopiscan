import { CartView } from "@/components/diner/cart-view";
import { parseSettings } from "@/lib/restaurant";
import { getActiveSession } from "@/lib/session";
import { resolveTheme } from "@/lib/theme/resolve";
import { getRestaurantBySlug } from "@/server/diner-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order" };

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = (await getRestaurantBySlug(slug))!;
  const session = await getActiveSession(slug);
  const settings = parseSettings(restaurant.settings);
  const theme = resolveTheme(restaurant.theme, restaurant.plan);
  const taxNote = settings.pricesIncludeTax
    ? null
    : `Prices are subject to ${settings.serviceChargePct ? `${settings.serviceChargePct}% service charge and ` : ""}${settings.gstPct}% GST.`;

  return (
    <CartView
      slug={slug}
      tableLabel={session?.restaurantId === restaurant.id ? session.tableLabel : null}
      orderingEnabled={settings.orderingEnabled}
      placeOrderLabel={theme.labels.placeOrder}
      taxNote={taxNote}
    />
  );
}
