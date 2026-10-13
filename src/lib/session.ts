import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { serverEnv } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

export const SESSION_TTL_SECS = 3 * 60 * 60;
const key = () => new TextEncoder().encode(serverEnv.SESSION_SECRET);

export type TableSessionClaims = { sid: string; rid: string; tid: string };

export const cookieName = (slug: string) => `kopiscan_t_${slug}`;

export async function signSession(claims: TableSessionClaims, ttlSecs = SESSION_TTL_SECS): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSecs)
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<TableSessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.sid !== "string" || typeof payload.rid !== "string" || typeof payload.tid !== "string") return null;
    return { sid: payload.sid, rid: payload.rid, tid: payload.tid };
  } catch {
    return null;
  }
}

export function hashIdentifier(value: string): string {
  return createHash("sha256").update(`${serverEnv.SESSION_SECRET}:${value}`).digest("hex").slice(0, 32);
}

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return hashIdentifier(ip);
}

export type ActiveSession = {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  tableLabel: string;
};

/**
 * Reads the signed cookie for this restaurant and checks the DB row is still open,
 * unexpired, and its table is still active. Slides the inactivity expiry.
 */
export async function getActiveSession(slug: string): Promise<ActiveSession | null> {
  const store = await cookies();
  const token = store.get(cookieName(slug))?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const db = createAdminClient();
  const { data } = await db
    .from("table_sessions")
    .select("id, restaurant_id, table_id, expires_at, closed_at, tables!inner(label, active)")
    .eq("id", claims.sid)
    .maybeSingle();
  if (!data || data.closed_at || new Date(data.expires_at) < new Date()) return null;
  if (data.restaurant_id !== claims.rid || data.table_id !== claims.tid) return null;
  const table = data.tables as unknown as { label: string; active: boolean };
  if (!table.active) return null;

  // sliding inactivity window — only bump if more than 5 min since last bump to save writes
  const newExpiry = new Date(Date.now() + SESSION_TTL_SECS * 1000);
  if (newExpiry.getTime() - new Date(data.expires_at).getTime() > 5 * 60 * 1000) {
    await db.from("table_sessions").update({ expires_at: newExpiry.toISOString(), last_seen_at: new Date().toISOString() }).eq("id", data.id);
  }
  return { sessionId: data.id, restaurantId: data.restaurant_id, tableId: data.table_id, tableLabel: table.label };
}
