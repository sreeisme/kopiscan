"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteStaff, removeMember } from "@/server/actions/team";
import { btn, Card, input } from "./ui";

type Member = { userId: string; role: "owner" | "staff"; email: string; pending: boolean; isMe: boolean };

export function TeamManager({ members, atLimit }: { members: Member[]; atLimit: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await inviteStaff(email);
      if (r.ok) {
        setMsg({ tone: "ok", text: `Invite sent to ${email}. They'll get an email to set a password.` });
        setEmail("");
        router.refresh();
      } else setMsg({ tone: "error", text: r.error });
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={invite} className="flex flex-wrap gap-2">
          <input
            className={`${input} min-w-60 flex-1`}
            type="email"
            required
            placeholder="staff@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className={btn.primary} disabled={pending || atLimit}>
            {pending ? "Sending…" : "Invite staff"}
          </button>
        </form>
        {atLimit && <p className="mt-2 text-sm text-amber-800">You&apos;ve reached your plan&apos;s staff limit. Contact us to upgrade.</p>}
        {msg && <p className={`mt-2 text-sm ${msg.tone === "ok" ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
        <p className="mt-3 text-xs text-neutral-500">
          Tip: for a shared kitchen tablet, invite one staff email (e.g. kitchen@yourrestaurant.com) and keep it signed in.
        </p>
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-neutral-100">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {m.email} {m.isMe && <span className="text-neutral-500">(you)</span>}
                </div>
                <div className="text-xs text-neutral-500">
                  {m.role === "owner" ? "Owner" : "Staff"}
                  {m.pending && " · invite not yet accepted"}
                </div>
              </div>
              {m.role === "staff" &&
                (confirm === m.userId ? (
                  <>
                    <button
                      className={btn.danger}
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const r = await removeMember(m.userId);
                          if (!r.ok) setMsg({ tone: "error", text: r.error });
                          setConfirm(null);
                          router.refresh();
                        })
                      }
                    >
                      Remove access
                    </button>
                    <button className={btn.ghost} onClick={() => setConfirm(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className={btn.ghost} onClick={() => setConfirm(m.userId)}>
                    Remove
                  </button>
                ))}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
