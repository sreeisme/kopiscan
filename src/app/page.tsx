import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { PLAN_INFO, PLANS, LIMITS, type Plan } from "@/lib/plans";
import { DemoRequestForm } from "./demo-request-form";

const EXTRAS: Record<Plan, string[]> = {
  basic: ["Logo, brand colour & 6 styles", "Today's printable summary"],
  pro: ["Sizes, spice levels & add-ons", "Full branding: fonts, layouts, cover photo", "30 days of summaries"],
  premium: ["Remove “Powered by Kopiscan”", "Your logo inside the QR codes", "Analytics: top dishes & peak hours", "Full history + CSV export"],
};

const TESTIMONIALS = [
  {
    restaurant: "Filter & Foam Fine South",
    area: "Indiranagar",
    quote:
      "During the weekend breakfast rush, our waitstaff used to spend half their time just taking orders for extra idlis and filter coffee refills. Since launching Kopiscan on our tables, table turnover speed increased by 35%, and our average ticket size went up because customers love ordering that extra coffee with a single tap!",
    person: "Ramesh Gowda",
    role: "Founder & Managing Partner",
  },
  {
    restaurant: "Namma Tandoor & Tiffin",
    area: "Koramangala",
    quote:
      "Being in a tech hub, our lunch crowd is 90% software engineers who want quick service during their break. Kopiscan eliminated order errors during peak hours and made ordering seamless for large office groups. It's been a total game-changer for our floor management.",
    person: "Priya Sundaram",
    role: "General Manager",
  },
  {
    restaurant: "The Glasshouse Microbrewery",
    area: "JP Nagar",
    quote:
      "In a noisy 200-seater rooftop setting, getting a server's attention for another round of drinks was always a customer pain point. Kopiscan solved that instantly. Guests just scan and order another craft beer directly from their table. Our beverage sales grew 22% in the first month!",
    person: "Vikram “Vicky” Hegde",
    role: "Operations Head",
  },
  {
    restaurant: "Malgudi Modern Bistro",
    area: "Whitefield",
    quote:
      "Updating our dynamic daily specials used to mean reprinting physical menu inserts every week. With Kopiscan's backend dashboard, we update items, prices, and 'out-of-stock' status in under 30 seconds. The zero setup fee made trying it out a complete no-brainer.",
    person: "Ananya Rao",
    role: "Head Chef & Co-Owner",
  },
  {
    restaurant: "Chai & Conversations Café",
    area: "HSR Layout",
    quote:
      "College students love seating themselves and browsing the visual menu right on their phones. Kopiscan's interface is super clean and fast even when phone networks are spotty. Plus, order accuracy has made our end-of-night operations much smoother.",
    person: "Karthik Nair",
    role: "Owner",
  },
];

const lim = (n: number | null, word: string) => (n === null ? `Unlimited ${word}` : `Up to ${n} ${word}`);

export default function Home() {
  const wa = publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "");
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Hi Kopiscan, I'd like to digitise my menu.")}` : null;

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-12">
        <nav className="mb-14 flex items-center justify-between">
          <span className="text-xl font-bold">Kopiscan</span>
          <Link href="/login" className="text-sm font-medium underline">
            Restaurant login
          </Link>
        </nav>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Your menu, on every table. Orders straight to your kitchen.</h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          We turn your physical menu into a QR ordering app in your restaurant&apos;s look. Diners scan, order, call a waiter or ask for the bill.
          No app to download and no hardware to buy.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700">
              WhatsApp us
            </a>
          )}
          <a href="#demo" className="rounded-lg bg-neutral-900 px-5 py-3 font-semibold text-white hover:bg-neutral-700">
            Request a demo
          </a>
          <a href="#pricing" className="rounded-lg border border-neutral-300 px-5 py-3 font-semibold">
            See pricing
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-10 sm:grid-cols-3">
        {[
          ["📱 Diners", "Scan the table QR, browse with photos, order, call staff or request the bill."],
          ["🔔 Staff", "Live order board with sound alerts. Acknowledge, mark done, print the day's summary."],
          ["🎨 Owners", "Edit the menu and mark items sold out in seconds. Match your brand. Print table cards."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-neutral-200 p-5">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-neutral-600">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold">Restaurants love it</h2>
        <div className="mt-8 columns-1 gap-4 md:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.restaurant} className="mb-4 break-inside-avoid rounded-xl border border-neutral-200 p-5">
              <blockquote className="text-sm leading-relaxed text-neutral-700">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <div className="font-semibold">{t.person}</div>
                <div className="text-neutral-500">
                  {t.role}, {t.restaurant} ({t.area})
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold">Simple monthly pricing</h2>
        <p className="mt-1 text-neutral-600">All plans include ordering, call waiter, request bill and the live staff board. Prices in SGD.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p} className={`rounded-2xl border p-6 ${p === "pro" ? "border-neutral-900 shadow-lg" : "border-neutral-200"}`}>
              <div className="font-semibold">{PLAN_INFO[p].name}</div>
              <div className="mt-2 text-4xl font-bold">
                S${PLAN_INFO[p].priceSgd}
                <span className="text-base font-normal text-neutral-500">/mo</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                <li>✓ {lim(LIMITS[p].tables, "tables")}</li>
                <li>✓ {lim(LIMITS[p].items, "menu items")}</li>
                <li>✓ {LIMITS[p].staff} staff logins</li>
                {EXTRAS[p].map((x) => (
                  <li key={x}>✓ {x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-12">
        <h2 className="text-3xl font-bold">See it with your own menu</h2>
        <p className="mt-1 mb-6 text-neutral-600">Tell us about your restaurant and we&apos;ll set up a live demo on your phone, in your colours.</p>
        <DemoRequestForm />
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} Kopiscan · Singapore
        {wa && <> · WhatsApp +{wa}</>}
      </footer>
    </main>
  );
}
