import { z } from "zod";

/** Public env (safe in the browser). */
export const publicEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional().default(""),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  });

export const STORAGE_BASE = `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-assets`;

export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${STORAGE_BASE}/${path}`;
}
