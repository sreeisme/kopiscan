"use server";

import { z } from "zod";
import { hitRateLimit, LIMITS } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/server-env";
import { clientIpHash } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/server/email";
import { okVoid, toError, type ActionResult } from "./result";

const DemoRequestSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  restaurant: z.string().trim().min(1, "Please enter your restaurant's name.").max(120),
  email: z.string().trim().email("Please enter a valid email.").max(200),
  phone: z.string().trim().max(40).default(""),
  message: z.string().trim().max(1000).default(""),
  website: z.string().max(0).default(""), // honeypot: real people leave it empty
});

/**
 * Public, unauthenticated by design (home page form). Guarded by zod, a honeypot and a per-IP rate limit.
 * Service role because anon has no grants; it only inserts one validated row into demo_requests.
 */
export async function requestDemo(input: unknown): Promise<ActionResult> {
  const parsed = DemoRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { website, ...req } = parsed.data;
  if (website) return okVoid; // bot: pretend it worked

  if (!(await hitRateLimit(`demo:ip:${await clientIpHash()}`, LIMITS.demoRequestPerIp)))
    return { ok: false, code: "RATE", error: "We've already got your request. We'll be in touch soon!" };

  try {
    const db = createAdminClient();
    const { data: row, error } = await db.from("demo_requests").insert(req).select("id").single();
    if (error) throw error;

    const emailed = await sendEmail({
      to: serverEnv.DEMO_REQUEST_TO,
      replyTo: req.email,
      subject: `Demo request: ${req.restaurant}`,
      text: [
        `Name: ${req.name}`,
        `Restaurant: ${req.restaurant}`,
        `Email: ${req.email}`,
        `Phone: ${req.phone || "-"}`,
        "",
        req.message || "(no message)",
      ].join("\n"),
    });
    if (emailed) await db.from("demo_requests").update({ emailed: true }).eq("id", row.id);
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}
