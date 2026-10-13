import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/diner/cart";
import { ToastProvider } from "@/components/diner/toast";
import { googleFontsHref, resolveTheme, themeToCssVars } from "@/lib/theme/resolve";
import { getRestaurantBySlug } from "@/server/diner-data";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = await getRestaurantBySlug((await params).slug);
  return { title: r ? `${r.name} — Menu` : "Menu" };
}

export default async function DinerLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const theme = resolveTheme(restaurant.theme, restaurant.plan);

  return (
    <div style={themeToCssVars(theme) as React.CSSProperties} className="bg-m-bg font-m-body text-m-text">
      { }
      <link rel="stylesheet" href={googleFontsHref(theme)} precedence="default" />
      <ToastProvider>
        <CartProvider slug={slug}>{children}</CartProvider>
      </ToastProvider>
    </div>
  );
}
