import Link from "next/link";
import { AdminPanel } from "@/components/dash/admin-panel";
import { PageHeader } from "@/components/dash/ui";
import { requirePlatformAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePlatformAdmin();
  const db = createAdminClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data: restaurants }, { data: orders }, { data: tables }, { data: items }] = await Promise.all([
    db.from("restaurants").select("id, slug, name, plan, status, created_at").order("created_at", { ascending: false }),
    db.from("orders").select("restaurant_id").gte("created_at", since).limit(100000),
    db.from("tables").select("restaurant_id"),
    db.from("menu_items").select("restaurant_id"),
  ]);
  const count = (rows: { restaurant_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.restaurant_id, (m.get(r.restaurant_id) ?? 0) + 1);
    return m;
  };
  const o = count(orders);
  const t = count(tables);
  const i = count(items);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex justify-between text-sm">
        <span className="font-bold">Menuly · Platform admin</span>
        <Link href="/staff" className="underline">
          Dashboard →
        </Link>
      </div>
      <PageHeader title="Restaurants" description="Create restaurants, invite owners, set plans. Billing is manual: update the plan after payment." />
      <AdminPanel
        restaurants={(restaurants ?? []).map((r) => ({
          ...r,
          orders30d: o.get(r.id) ?? 0,
          tables: t.get(r.id) ?? 0,
          items: i.get(r.id) ?? 0,
        }))}
      />
    </main>
  );
}
