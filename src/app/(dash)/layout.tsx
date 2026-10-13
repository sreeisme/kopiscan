import Link from "next/link";
import { DashNav } from "@/components/dash/nav";
import { RestaurantSwitcher } from "@/components/dash/switcher";
import { requireMember } from "@/lib/auth";
import { PLAN_INFO } from "@/lib/plans";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireMember();
  const { restaurant, role } = ctx;
  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/staff" className="text-lg font-bold">
            Menuly
          </Link>
          <RestaurantSwitcher current={restaurant.id} name={restaurant.name} memberships={ctx.memberships} />
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">{PLAN_INFO[restaurant.plan].name}</span>
          {restaurant.status === "suspended" && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Suspended</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <a href={`/r/${restaurant.slug}`} target="_blank" className="text-sm text-neutral-600 underline">
              View menu ↗
            </a>
            {ctx.isPlatformAdmin && (
              <Link href="/admin" className="text-sm text-neutral-600 underline">
                Admin
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button className="text-sm text-neutral-600 underline">Sign out</button>
            </form>
          </div>
        </div>
        <DashNav isOwner={role === "owner"} />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
