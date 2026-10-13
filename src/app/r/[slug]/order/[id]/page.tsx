import { OrderStatus } from "@/components/diner/order-status";
import { resolveTheme } from "@/lib/theme/resolve";
import { getRestaurantBySlug } from "@/server/diner-data";

export const metadata = { title: "Order status" };

export default async function OrderPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const restaurant = (await getRestaurantBySlug(slug))!;
  const theme = resolveTheme(restaurant.theme, restaurant.plan);
  return <OrderStatus slug={slug} orderId={id} labels={theme.labels} />;
}
