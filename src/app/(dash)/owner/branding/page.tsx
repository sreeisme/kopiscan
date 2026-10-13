import { BrandingEditor } from "@/components/dash/branding-editor";
import { PageHeader } from "@/components/dash/ui";
import { requireMember } from "@/lib/auth";
import { STORAGE_BASE } from "@/lib/env";
import { hasFeature } from "@/lib/plans";
import { resolveTheme } from "@/lib/theme/resolve";
import { getMenu } from "@/server/diner-data";

export const metadata = { title: "Branding" };
export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const { restaurant } = await requireMember({ role: "owner" });
  const menu = await getMenu(restaurant);
  return (
    <>
      <PageHeader title="Branding" description="Make the menu look like your restaurant. The preview updates as you edit." />
      <BrandingEditor
        restaurantId={restaurant.id}
        slug={restaurant.slug}
        name={restaurant.name}
        initial={resolveTheme(restaurant.theme, restaurant.plan)}
        menu={menu}
        imageBase={STORAGE_BASE}
        advanced={hasFeature(restaurant.plan, "themeAdvanced")}
        canRemoveBranding={hasFeature(restaurant.plan, "removeBranding")}
      />
    </>
  );
}
