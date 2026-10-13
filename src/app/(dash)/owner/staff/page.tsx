import { TeamManager } from "@/components/dash/team-manager";
import { PageHeader } from "@/components/dash/ui";
import { requireMember } from "@/lib/auth";
import { limitFor } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

export default async function StaffMembersPage() {
  const { restaurant, userId } = await requireMember({ role: "owner" });
  const db = createAdminClient();
  const { data } = await db.from("memberships").select("user_id, role, created_at").eq("restaurant_id", restaurant.id).order("created_at");
  const members = await Promise.all(
    (data ?? []).map(async (m) => {
      const { data: u } = await db.auth.admin.getUserById(m.user_id);
      return {
        userId: m.user_id as string,
        role: m.role as "owner" | "staff",
        email: u.user?.email ?? "(unknown)",
        pending: !u.user?.last_sign_in_at,
        isMe: m.user_id === userId,
      };
    }),
  );
  const staffCount = members.filter((m) => m.role === "staff").length;
  const max = limitFor(restaurant.plan, "staff");

  return (
    <>
      <PageHeader
        title="Staff"
        description={`${staffCount}${max ? ` / ${max}` : ""} staff accounts. Staff can see live orders, the daily summary and mark items sold out. They can't edit the menu, tables or branding.`}
      />
      <TeamManager members={members} atLimit={max !== null && staffCount >= max} />
    </>
  );
}
