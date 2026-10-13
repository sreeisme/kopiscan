"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTables, deleteTable, rotateTableToken, updateTable } from "@/server/actions/tables";
import type { ActionResult } from "@/server/actions/result";
import { btn, Card, cx, Field, input } from "./ui";

type T = { id: string; label: string; active: boolean; url: string; svg: string };

export function TablesManager({ tables, max }: { tables: T[]; max: number | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [single, setSingle] = useState("");
  const [range, setRange] = useState({ prefix: "", from: "1", to: "10" });
  const [confirm, setConfirm] = useState<{ id: string; kind: "rotate" | "delete" } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>, after?: () => void) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setErr(r.error);
      else {
        after?.();
        setConfirm(null);
        router.refresh();
      }
    });
  }

  function addRange() {
    const a = parseInt(range.from, 10);
    const b = parseInt(range.to, 10);
    if (!(a >= 0 && b >= a && b - a < 100)) return setErr("Enter a range of up to 100 tables.");
    const labels = Array.from({ length: b - a + 1 }, (_, i) => `${range.prefix}${a + i}`);
    run(() => createTables({ labels }));
  }

  const full = max !== null && tables.length >= max;

  return (
    <div className="space-y-5">
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{err}</p>}
      <Card className="grid gap-4 md:grid-cols-2">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createTables({ labels: [single] }), () => setSingle(""));
          }}
        >
          <div className="flex-1">
            <Field label="Add a table">
              <input className={input} value={single} maxLength={20} placeholder="e.g. 12, A3, Patio 1" onChange={(e) => setSingle(e.target.value)} />
            </Field>
          </div>
          <button className={btn.primary} disabled={pending || !single.trim() || full}>
            Add
          </button>
        </form>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Prefix">
            <input className={`${input} w-20`} value={range.prefix} maxLength={8} placeholder="opt." onChange={(e) => setRange({ ...range, prefix: e.target.value })} />
          </Field>
          <Field label="From">
            <input className={`${input} w-20`} inputMode="numeric" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </Field>
          <Field label="To">
            <input className={`${input} w-20`} inputMode="numeric" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </Field>
          <button className={btn.secondary} disabled={pending || full} onClick={addRange}>
            Add range
          </button>
        </div>
        {full && <p className="text-sm text-amber-800 md:col-span-2">You&apos;ve reached your plan&apos;s table limit. Contact us to upgrade.</p>}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <Card key={t.id} className={cx("space-y-3", !t.active && "opacity-60")}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Table {t.label}</h3>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={t.active} onChange={(e) => run(() => updateTable(t.id, { active: e.target.checked }))} />
                Active
              </label>
            </div>
            <div className="mx-auto w-40" dangerouslySetInnerHTML={{ __html: t.svg }} />
            <div className="flex flex-wrap gap-2">
              <a className={btn.secondary} href={`/owner/tables/qr/${t.id}?format=png`}>
                PNG
              </a>
              <a className={btn.secondary} href={`/owner/tables/qr/${t.id}?format=svg`}>
                SVG
              </a>
              <button
                className={btn.ghost}
                onClick={async () => {
                  await navigator.clipboard.writeText(t.url);
                  setCopied(t.id);
                  setTimeout(() => setCopied(null), 1500);
                }}
              >
                {copied === t.id ? "Copied!" : "Copy link"}
              </button>
            </div>
            {confirm?.id === t.id ? (
              <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm">
                <p>
                  {confirm.kind === "rotate"
                    ? "The printed QR for this table will stop working and you'll need to print a new one. Continue?"
                    : "Delete this table and its order history?"}
                </p>
                <div className="flex gap-2">
                  <button
                    className={btn.danger}
                    disabled={pending}
                    onClick={() => run(() => (confirm.kind === "rotate" ? rotateTableToken(t.id) : deleteTable(t.id)))}
                  >
                    Yes, {confirm.kind === "rotate" ? "replace QR" : "delete"}
                  </button>
                  <button className={btn.ghost} onClick={() => setConfirm(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 border-t border-neutral-100 pt-2">
                <button className={btn.ghost} onClick={() => setConfirm({ id: t.id, kind: "rotate" })} title="Use if a QR code was copied or misused">
                  Replace QR
                </button>
                <button className={`${btn.ghost} text-red-700`} onClick={() => setConfirm({ id: t.id, kind: "delete" })}>
                  Delete
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {tables.length > 0 && (
        <p className="text-sm text-neutral-500">
          Tip: tables that are deactivated can&apos;t order. Use <strong>Replace QR</strong> if someone takes a photo of a code and orders from outside.
        </p>
      )}
    </div>
  );
}
