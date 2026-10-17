import "server-only";
import { z } from "zod";

export const serverEnv = z
  .object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
    // Demo-request emails. Without a key, requests are still saved to demo_requests.
    RESEND_API_KEY: z.string().optional().default(""),
    RESEND_FROM: z.string().optional().default("Kopiscan <onboarding@resend.dev>"),
    DEMO_REQUEST_TO: z.string().email().optional().default("vaka.sreekethav@gmail.com"),
  })
  .parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    RESEND_FROM: process.env.RESEND_FROM || undefined,
    DEMO_REQUEST_TO: process.env.DEMO_REQUEST_TO || undefined,
  });
