"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client for logged-in dashboard users (staff realtime, owner uploads). Never used by diner pages. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
