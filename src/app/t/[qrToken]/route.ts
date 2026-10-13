import { NextResponse, type NextRequest } from "next/server";
import { LIMITS, hitRateLimit } from "@/lib/rate-limit";
import { clientIpHash, cookieName, getActiveSession, hashIdentifier, SESSION_TTL_SECS, signSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * QR scan entry. Validates the table token, creates (or reuses) a table session,
 * sets a signed HttpOnly cookie scoped to the restaurant, then redirects to the menu.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;
  const notFound = () => NextResponse.redirect(new URL("/scan-invalid", request.url));
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(qrToken)) return notFound();

  const db = createAdminClient();
  const { data: table } = await db
    .from("tables")
    .select("id, restaurant_id, active, restaurants!inner(slug, status)")
    .eq("qr_token", qrToken)
    .maybeSingle();
  const restaurant = table?.restaurants as unknown as { slug: string; status: string } | undefined;
  if (!table || !table.active || !restaurant || restaurant.status === "suspended") return notFound();

  const menuUrl = new URL(`/r/${restaurant.slug}`, request.url);

  // Reuse an existing valid session for the same table (re-scans, page reloads).
  const existing = await getActiveSession(restaurant.slug);
  if (existing && existing.tableId === table.id) return NextResponse.redirect(menuUrl);

  const ipHash = await clientIpHash();
  if (!(await hitRateLimit(`sess:ip:${ipHash}`, LIMITS.sessionCreatePerIp))) {
    return new NextResponse("Too many requests. Please wait a few minutes and scan again.", { status: 429 });
  }

  const { data: session, error } = await db
    .from("table_sessions")
    .insert({
      restaurant_id: table.restaurant_id,
      table_id: table.id,
      ip_hash: ipHash,
      ua_hash: hashIdentifier(request.headers.get("user-agent") ?? ""),
    })
    .select("id")
    .single();
  if (error || !session) return new NextResponse("Could not start your table session. Please try again.", { status: 500 });

  // Cookie outlives the inactivity window; the DB row is the real authority on expiry.
  const token = await signSession({ sid: session.id, rid: table.restaurant_id, tid: table.id }, 12 * 60 * 60);
  const res = NextResponse.redirect(menuUrl);
  res.cookies.set(cookieName(restaurant.slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(SESSION_TTL_SECS, 12 * 60 * 60),
  });
  return res;
}
