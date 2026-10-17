import "server-only";
import { serverEnv } from "@/lib/server-env";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Send via Resend's HTTP API. Returns false (never throws) if unconfigured or the send fails. */
export async function sendEmail(msg: { to: string; subject: string; text: string; replyTo?: string }): Promise<boolean> {
  if (!serverEnv.RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: serverEnv.RESEND_FROM,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: `<pre style="font-family:inherit;white-space:pre-wrap">${escape(msg.text)}</pre>`,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("resend error", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("resend error", e);
    return false;
  }
}
