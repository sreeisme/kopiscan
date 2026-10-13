import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Handles invite, magic-link and password-reset links (both PKCE `code` and `token_hash` styles). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawNext = url.searchParams.get("next") ?? "/staff";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/staff";
  const supabase = await createClient();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  // Invited users and password resets go set a password first.
  const dest = type === "invite" || type === "recovery" ? "/auth/set-password" : next;
  return NextResponse.redirect(new URL(ok ? dest : "/login?error=link", request.url));
}
