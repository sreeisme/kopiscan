import { PrintButton } from "@/components/dash/print-button";
import { requireMember } from "@/lib/auth";
import { storageUrl } from "@/lib/env";
import { hasFeature } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTheme } from "@/lib/theme/resolve";
import { tableQrSvg } from "@/server/qr";

export const metadata = { title: "Print table cards" };
export const dynamic = "force-dynamic";

/** A4 sheet, 4 cards per page (2×2), cut along the dashed lines. */
export default async function PrintTablesPage() {
  const { restaurant } = await requireMember({ role: "owner" });
  const theme = resolveTheme(restaurant.theme, restaurant.plan);
  const logo = storageUrl(theme.assets.logoPath);
  const branded = hasFeature(restaurant.plan, "brandedQr") ? logo : null;
  const { data } = await createAdminClient()
    .from("tables")
    .select("id, label, qr_token")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true)
    .order("sort")
    .order("label");
  const cards = await Promise.all((data ?? []).map(async (t) => ({ ...t, svg: await tableQrSvg(t.qr_token, { logoUrl: branded }) })));

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {cards.length} active tables · prints 4 per A4 page. Use &quot;Background graphics&quot; in the print dialog for colours.
        </p>
        <PrintButton label="Print" />
      </div>
      <div className="grid grid-cols-2 gap-0 bg-white print:gap-0">
        {cards.map((t) => (
          <div
            key={t.id}
            className="flex h-[136mm] flex-col items-center justify-center gap-3 border border-dashed border-neutral-300 p-6 text-center [break-inside:avoid]"
          >
            {logo ? (
              <img src={logo} alt="" className="h-14 object-contain" />
            ) : (
              <div className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                {restaurant.name}
              </div>
            )}
            <div className="text-lg font-semibold">Scan to view menu &amp; order</div>
            <div className="w-[62mm]" dangerouslySetInnerHTML={{ __html: t.svg }} />
            <div className="rounded-full px-5 py-1.5 text-2xl font-bold" style={{ background: theme.colors.primary, color: theme.colors.onPrimary }}>
              Table {t.label}
            </div>
            <div className="text-xs text-neutral-500">Open your phone camera and point it at the code</div>
          </div>
        ))}
      </div>
    </div>
  );
}
