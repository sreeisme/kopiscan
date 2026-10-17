import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const LIMITS = {
  sessionCreatePerIp: { limit: 30, windowSecs: 600 },
  orderPerSession: { limit: 5, windowSecs: 600 },
  orderPerTable: { limit: 20, windowSecs: 600 },
  requestPerSession: { limit: 1, windowSecs: 60 }, // per type → 60s cooldown
  requestPerTable: { limit: 6, windowSecs: 600 },
  demoRequestPerIp: { limit: 3, windowSecs: 3600 },
} as const;

/** Returns true if allowed. Fails CLOSED if the DB call errors. */
export async function hitRateLimit(key: string, rule: { limit: number; windowSecs: number }): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("hit_rate_limit", {
    p_key: key,
    p_limit: rule.limit,
    p_window_secs: rule.windowSecs,
  });
  if (error) {
    console.error("rate limit error", error);
    return false;
  }
  return data === true;
}
