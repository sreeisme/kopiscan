import "server-only";
import { z } from "zod";

export const serverEnv = z
  .object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  })
  .parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
