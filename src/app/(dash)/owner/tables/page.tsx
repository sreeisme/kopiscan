import Link from "next/link";
import { TablesManager } from "@/components/dash/tables-manager";
import { PageHeader, btn } from "@/components/dash/ui";
import { requireMember } from "@/lib/auth";
import { limitFor } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { tableQrSvg, tableUrl } from "@/server/qr";

export const metadata = { title: "Tables & QR codes" };
export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const { restaurant } = await requireMember({ role: "owner" });
  const { data } = await createAdminClient()
    .from("tables")
    .select("id, label, qr_token, active, sort")
    .eq("restaurant_id", restaurant.id)
    .order("sort")
    .order("label");
  const tables = await Promise.all(
    (data ?? []).map(async (t) => ({ id: t.id, label: t.label, active: t.active, url: tableUrl(t.qr_token), svg: await tableQrSvg(t.qr_token) })),
  );
  const max = limitFor(restaurant.plan, "tables");

  return (
    <>
      <PageHeader
        title="Tables & QR codes"
        description={`${tables.length}${max ? ` / ${max}` : ""} tables. Each table has its own QR code.`}
        actions={
          tables.length > 0 && (
            <Link className={btn.primary} href="/owner/tables/print" target="_blank">
              🖨 Print table cards
            </Link>
          )
        }
      />
      <TablesManager tables={tables} max={max} />
    </>
  );
}
