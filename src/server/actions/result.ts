import { PlanError } from "@/lib/plans";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const okVoid: ActionResult = { ok: true, data: undefined };

/** Map known errors to user-facing messages; log and hide everything else. */
export function toError(e: unknown): { ok: false; error: string; code?: string } {
  if (e instanceof PlanError) return { ok: false, code: "PLAN", error: e.message };
  const pg = e as { code?: string; message?: string } | null;
  if (pg?.message?.startsWith("PLAN_LIMIT")) return { ok: false, code: "PLAN", error: "You've reached your plan's limit. Upgrade to add more." };
  if (pg?.code === "23505") return { ok: false, code: "DUPLICATE", error: "That name is already in use." };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/** Throw on Supabase error so toError can classify it. */
export function check<T extends { error: unknown }>(res: T): T {
  if (res.error) throw res.error;
  return res;
}
