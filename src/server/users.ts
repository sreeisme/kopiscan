import "server-only";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Invite (or attach an existing user) by email. Returns the user id. */
export async function inviteOrFindUser(email: string): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/set-password`,
  });
  if (data?.user) return data.user.id;
  // Already registered → look them up.
  if (error && /already|registered|exists/i.test(error.message)) {
    for (let page = 1; page <= 20; page++) {
      const { data: list } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      const hit = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (hit) return hit.id;
      if (!list || list.users.length < 1000) break;
    }
  }
  throw error ?? new Error("Could not invite user");
}
