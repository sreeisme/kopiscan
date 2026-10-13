"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/dash/ui";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return setErr("Use at least 10 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    router.replace("/staff");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <div className="text-2xl font-bold">Set your password</div>
        <p className="text-sm text-neutral-600">You will use this to sign in to Menuly.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input className={input} type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input className={input} type="password" autoComplete="new-password" placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <button className={`${btn.primary} w-full`} disabled={busy}>
          Save password
        </button>
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      </form>
    </main>
  );
}
