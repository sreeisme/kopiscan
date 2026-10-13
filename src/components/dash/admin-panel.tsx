"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PLAN_INFO, PLANS, type Plan } from "@/lib/plans";
import { createRestaurant, setRestaurantPlan, setRestaurantStatus } from "@/server/actions/admin";
import { switchRestaurant } from "@/server/actions/team";
import { btn, Card, Field, input } from "./ui";

type R = { id: string; slug: string; name: string; plan: Plan; status: string; created_at: string; orders30d: number; tables: number; items: number };

export function AdminPanel({ restaurants }: { restaurants: R[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", plan: "basic" as Plan, ownerEmail: "" });
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await createRestaurant(form);
      if (r.ok) {
        setMsg({ tone: "ok", text: `Created ${form.name}. Invite emailed to ${form.ownerEmail}.` });
        setForm({ name: "", slug: "", plan: "basic", ownerEmail: "" });
        router.refresh();
      } else setMsg({ tone: "error", text: r.error });
    });
  }

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-semibold">New restaurant</h2>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-5 md:items-end">
          <Field label="Name">
            <input className={input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="URL slug">
            <input className={input} required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Plan">
            <select className={input} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Plan })}>
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {PLAN_INFO[p].name} (S${PLAN_INFO[p].priceSgd})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Owner email">
            <input className={input} type="email" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
          </Field>
          <button className={btn.primary} disabled={pending}>
            {pending ? "Creating…" : "Create + invite"}
          </button>
        </form>
        {msg && <p className={`mt-3 text-sm ${msg.tone === "ok" ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2">Restaurant</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Tables</th>
              <th className="px-4 py-2 text-right">Items</th>
              <th className="px-4 py-2 text-right">Orders 30d</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2">
                  <div className="font-medium">{r.name}</div>
                  <a href={`/r/${r.slug}`} target="_blank" className="text-xs text-neutral-500 underline">
                    /r/{r.slug}
                  </a>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="rounded border border-neutral-300 px-2 py-1"
                    value={r.plan}
                    disabled={pending}
                    onChange={(e) => start(async () => void (await setRestaurantPlan(r.id, e.target.value), router.refresh()))}
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>
                        {PLAN_INFO[p].name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="rounded border border-neutral-300 px-2 py-1"
                    value={r.status}
                    disabled={pending}
                    onChange={(e) => start(async () => void (await setRestaurantStatus(r.id, e.target.value), router.refresh()))}
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{r.tables}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.items}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.orders30d}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    className={btn.ghost}
                    onClick={() =>
                      start(async () => {
                        await switchRestaurant(r.id);
                        router.push("/owner/menu");
                      })
                    }
                  >
                    Open dashboard →
                  </button>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No restaurants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
