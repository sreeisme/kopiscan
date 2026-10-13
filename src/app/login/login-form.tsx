"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/dash/ui";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const supabase = createClient();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg({ tone: "error", text: "Wrong email or password." });
    router.replace(next);
    router.refresh();
  }

  async function magicLink() {
    if (!email) return setMsg({ tone: "error", text: "Enter your email first." });
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    setMsg(
      error
        ? { tone: "error", text: "Could not send the link. Check the email address." }
        : { tone: "ok", text: "Check your email for a sign-in link." },
    );
  }

  async function forgot() {
    if (!email) return setMsg({ tone: "error", text: "Enter your email first." });
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password` });
    setBusy(false);
    setMsg({ tone: "ok", text: "If that account exists, a reset link is on its way." });
  }

  return (
    <form onSubmit={signIn} className="space-y-3">
      <input className={input} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        className={input}
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className={`${btn.primary} w-full`} disabled={busy}>
        {busy ? "Please wait…" : "Sign in"}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" className="text-neutral-600 underline" onClick={magicLink} disabled={busy}>
          Email me a sign-in link
        </button>
        <button type="button" className="text-neutral-600 underline" onClick={forgot} disabled={busy}>
          Forgot password
        </button>
      </div>
      {msg && (
        <p className={`rounded-lg p-3 text-sm ${msg.tone === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{msg.text}</p>
      )}
    </form>
  );
}
