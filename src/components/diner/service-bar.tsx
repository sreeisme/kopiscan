"use client";

import { useState, useTransition } from "react";
import { createServiceRequest } from "@/server/actions/diner";
import { useToast } from "./toast";

/** Call waiter / request bill. Server de-duplicates and rate-limits; UI adds a local cooldown too. */
export function ServiceButtons({
  slug,
  labels,
  preview,
}: {
  slug: string;
  labels: { callWaiter: string; requestBill: string };
  preview?: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [cooldown, setCooldown] = useState<Record<string, boolean>>({});

  function send(type: "call_waiter" | "bill") {
    if (preview || cooldown[type]) return;
    start(async () => {
      const r = await createServiceRequest(slug, type);
      if (r.ok) {
        toast(type === "bill" ? "Staff will bring your bill shortly." : "A staff member is on the way.");
        setCooldown((c) => ({ ...c, [type]: true }));
        setTimeout(() => setCooldown((c) => ({ ...c, [type]: false })), 60_000);
      } else toast(r.error, "error");
    });
  }

  const cls =
    "flex-1 rounded-m border border-m-primary bg-m-surface px-3 py-2.5 text-sm font-semibold text-m-text disabled:opacity-50";
  return (
    <div className="flex gap-2">
      <button className={cls} disabled={pending || cooldown.call_waiter} onClick={() => send("call_waiter")}>
        {cooldown.call_waiter ? "Staff notified" : labels.callWaiter}
      </button>
      <button className={cls} disabled={pending || cooldown.bill} onClick={() => send("bill")}>
        {cooldown.bill ? "Bill requested" : labels.requestBill}
      </button>
    </div>
  );
}
