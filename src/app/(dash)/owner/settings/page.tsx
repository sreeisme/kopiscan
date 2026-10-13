import { SettingsForm } from "@/components/dash/settings-form";
import { PageHeader } from "@/components/dash/ui";
import { requireMember } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { PLAN_INFO } from "@/lib/plans";
import { parseSettings } from "@/lib/restaurant";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { restaurant } = await requireMember({ role: "owner" });
  const wa = publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "");
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForm name={restaurant.name} settings={parseSettings(restaurant.settings)} />
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 text-sm">
        <div className="font-semibold">Your plan: {PLAN_INFO[restaurant.plan].name}</div>
        <p className="mt-1 text-neutral-600">
          Menu link: <code className="rounded bg-neutral-100 px-1">{publicEnv.NEXT_PUBLIC_SITE_URL}/r/{restaurant.slug}</code>
        </p>
        {wa && (
          <p className="mt-2">
            Need help or want to change plan? WhatsApp us:{" "}
            <a className="font-semibold underline" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
              +{wa}
            </a>
          </p>
        )}
      </div>
    </>
  );
}
