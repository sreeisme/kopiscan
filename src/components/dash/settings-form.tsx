"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Settings } from "@/lib/restaurant";
import { saveSettings } from "@/server/actions/branding";
import { btn, Card, Field, input } from "./ui";

export function SettingsForm({ name: initialName, settings }: { name: string; settings: Settings }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveSettings({ name, ...s });
      setMsg(r.ok ? { tone: "ok", text: "Saved." } : { tone: "error", text: r.error });
      if (r.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={save}>
      <Card className="space-y-4">
        <Field label="Restaurant name">
          <input className={input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Menu prices</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={s.pricesIncludeTax} onChange={() => setS({ ...s, pricesIncludeTax: true })} />
            Nett prices (already include any service charge and GST)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!s.pricesIncludeTax} onChange={() => setS({ ...s, pricesIncludeTax: false })} />
            Prices are before service charge and GST (&quot;++&quot;)
          </label>
        </fieldset>

        {!s.pricesIncludeTax && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Service charge %" hint="Usually 10, or 0 if none">
              <input
                className={input}
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={s.serviceChargePct}
                onChange={(e) => setS({ ...s, serviceChargePct: Number(e.target.value) })}
              />
            </Field>
            <Field label="GST %" hint="9% from 2024. Set 0 if not GST-registered.">
              <input className={input} type="number" min={0} max={30} step={0.5} value={s.gstPct} onChange={(e) => setS({ ...s, gstPct: Number(e.target.value) })} />
            </Field>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.orderingEnabled} onChange={(e) => setS({ ...s, orderingEnabled: e.target.checked })} />
          Accept orders from table QR codes (turn off to show the menu only)
        </label>

        <div className="flex items-center gap-3">
          <button className={btn.primary} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </button>
          {msg && <span className={`text-sm ${msg.tone === "ok" ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
        </div>
      </Card>
    </form>
  );
}
