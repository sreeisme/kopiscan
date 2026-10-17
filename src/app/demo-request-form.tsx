"use client";

import { useState } from "react";
import { btn, input } from "@/components/dash/ui";
import { requestDemo } from "@/server/actions/demo";

export function DemoRequestForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await requestDemo(Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (res.ok) setSent(true);
    else setError(res.error);
  }

  if (sent)
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-900">
        <div className="font-semibold">Thanks! We&apos;ve got your request.</div>
        <p className="mt-1 text-sm">We&apos;ll reach out within one working day to set up a demo with your own menu.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className={input} name="name" autoComplete="name" placeholder="Your name" maxLength={100} required />
      <input className={input} name="restaurant" autoComplete="organization" placeholder="Restaurant name" maxLength={120} required />
      <input className={input} name="email" type="email" autoComplete="email" placeholder="Email" maxLength={200} required />
      <input className={input} name="phone" type="tel" autoComplete="tel" placeholder="Phone / WhatsApp (optional)" maxLength={40} />
      <textarea
        className={`${input} sm:col-span-2`}
        name="message"
        rows={3}
        maxLength={1000}
        placeholder="Anything we should know? Number of tables, outlets, current POS… (optional)"
      />
      {/* Honeypot: hidden from people, filled by bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" className={`${btn.primary} px-5 py-3 text-base`} disabled={busy}>
          {busy ? "Sending…" : "Request a demo"}
        </button>
      </div>
    </form>
  );
}
