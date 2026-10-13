"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CartProvider } from "@/components/diner/cart";
import { MenuView } from "@/components/diner/menu-view";
import { ToastProvider } from "@/components/diner/toast";
import { checkThemeContrast, contrastRatio } from "@/lib/theme/contrast";
import { PRESETS } from "@/lib/theme/presets";
import { googleFontsHref, themeToCssVars } from "@/lib/theme/resolve";
import { FONTS, type Theme } from "@/lib/theme/schema";
import type { MenuCategory } from "@/server/diner-data";
import { saveTheme } from "@/server/actions/branding";
import { ImageUpload } from "./image-upload";
import { btn, Card, cx, Field, input, Upsell } from "./ui";

const COLOR_FIELDS: { key: keyof Theme["colors"]; label: string }[] = [
  { key: "primary", label: "Primary (buttons)" },
  { key: "onPrimary", label: "Text on primary" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Cards" },
  { key: "text", label: "Text" },
  { key: "mutedText", label: "Secondary text" },
  { key: "accent", label: "Accent (tags)" },
];

function matchPreset(t: Theme) {
  return (
    PRESETS.find((p) => p.colors.background === t.colors.background && p.font.heading === t.font.heading && p.radius === t.radius)?.id ?? PRESETS[0].id
  );
}

export function BrandingEditor({
  restaurantId,
  slug,
  name,
  initial,
  menu,
  imageBase,
  advanced,
  canRemoveBranding,
}: {
  restaurantId: string;
  slug: string;
  name: string;
  initial: Theme;
  menu: MenuCategory[];
  imageBase: string;
  advanced: boolean;
  canRemoveBranding: boolean;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(initial);
  const [presetId, setPresetId] = useState(() => matchPreset(initial));
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const issues = useMemo(() => checkThemeContrast(theme.colors), [theme.colors]);
  const dirty = JSON.stringify(theme) !== JSON.stringify(initial);

  const set = <K extends keyof Theme>(k: K, v: Theme[K]) => setTheme((t) => ({ ...t, [k]: v }));

  function setColor(key: keyof Theme["colors"], value: string) {
    setTheme((t) => {
      const colors = { ...t.colors, [key]: value };
      // Basic plans can't pick button text colour: mirror the server's automatic black/white choice.
      if (!advanced && key === "primary" && /^#[0-9a-fA-F]{6}$/.test(value))
        colors.onPrimary = contrastRatio("#FFFFFF", value) >= contrastRatio("#111111", value) ? "#FFFFFF" : "#111111";
      return { ...t, colors };
    });
  }

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)!;
    setPresetId(id);
    setTheme((t) => ({ ...t, colors: { ...p.colors }, font: { ...p.font }, radius: p.radius }));
  }

  function save() {
    setMsg(null);
    start(async () => {
      const r = advanced
        ? await saveTheme({ theme })
        : await saveTheme({ basic: { presetId, primary: theme.colors.primary, logoPath: theme.assets.logoPath } });
      if (r.ok) {
        setMsg({ tone: "ok", text: "Saved. Diners will see the new look straight away." });
        router.refresh();
      } else setMsg({ tone: "error", text: r.error });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-5">
        <Card className="space-y-3">
          <h2 className="font-semibold">Start from a style</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={cx("rounded-xl border-2 p-3 text-left", presetId === p.id ? "border-neutral-900" : "border-neutral-200")}
                style={{ background: p.colors.background, color: p.colors.text, fontFamily: p.font.heading }}
              >
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="mt-2 flex gap-1">
                  {[p.colors.primary, p.colors.surface, p.colors.accent].map((c, i) => (
                    <span key={i} className="size-5 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Logo &amp; colours</h2>
          <Field label="Logo" hint="Square or wide PNG/JPG. Shown at the top of the menu and on table cards.">
            <ImageUpload
              restaurantId={restaurantId}
              folder="brand"
              value={theme.assets.logoPath}
              imageBase={imageBase}
              maxSize={600}
              onChange={(p) => set("assets", { ...theme.assets, logoPath: p })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {COLOR_FIELDS.filter((f) => advanced || f.key === "primary").map((f) => (
              <Field key={f.key} label={f.label}>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors[f.key]}
                    onChange={(e) => setColor(f.key, e.target.value.toUpperCase())}
                    className="h-9 w-12 cursor-pointer rounded border border-neutral-300"
                  />
                  <input
                    className={input}
                    value={theme.colors[f.key]}
                    maxLength={7}
                    onChange={(e) => setColor(f.key, e.target.value)}
                  />
                </div>
              </Field>
            ))}
          </div>
          {issues.length > 0 && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
              <div className="font-semibold">Some text will be hard to read:</div>
              <ul className="list-disc pl-5">
                {issues.map((i) => (
                  <li key={i.pair}>
                    {i.pair}: {i.ratio}:1 (needs {i.min}:1)
                  </li>
                ))}
              </ul>
              {!advanced && <div className="mt-1">Try a darker primary colour. (Button text colour is chosen automatically when you save.)</div>}
            </div>
          )}
        </Card>

        {!advanced && (
          <Upsell feature="themeAdvanced">Unlock full colour control, fonts, layouts, a cover photo and your own button wording.</Upsell>
        )}

        {advanced && (
          <Card className="space-y-4">
            <h2 className="font-semibold">Layout &amp; type</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Heading font">
                <select className={input} value={theme.font.heading} onChange={(e) => set("font", { ...theme.font, heading: e.target.value as Theme["font"]["heading"] })}>
                  {FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label="Body font">
                <select className={input} value={theme.font.body} onChange={(e) => set("font", { ...theme.font, body: e.target.value as Theme["font"]["body"] })}>
                  {FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label="Menu layout">
                <select className={input} value={theme.layout} onChange={(e) => set("layout", e.target.value as Theme["layout"])}>
                  <option value="list">List (compact)</option>
                  <option value="grid">Grid (2 columns)</option>
                  <option value="cards">Cards (large photos)</option>
                </select>
              </Field>
              <Field label="Corner style">
                <select className={input} value={theme.radius} onChange={(e) => set("radius", e.target.value as Theme["radius"])}>
                  <option value="none">Square</option>
                  <option value="sm">Slight</option>
                  <option value="md">Medium</option>
                  <option value="lg">Rounded</option>
                  <option value="full">Pill</option>
                </select>
              </Field>
            </div>
            <Field label="Cover photo" hint="Wide image shown at the top of the menu.">
              <ImageUpload
                restaurantId={restaurantId}
                folder="brand"
                value={theme.assets.coverPath}
                imageBase={imageBase}
                maxSize={1600}
                onChange={(p) => set("assets", { ...theme.assets, coverPath: p })}
              />
            </Field>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["showImages", "Show dish photos"],
                  ["showDescriptions", "Show descriptions"],
                  ["showTags", "Show tags"],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={theme.toggles[k]} onChange={(e) => set("toggles", { ...theme.toggles, [k]: e.target.checked })} />
                  {l}
                </label>
              ))}
            </div>
          </Card>
        )}

        {advanced && (
          <Card className="space-y-3">
            <h2 className="font-semibold">Wording</h2>
            <Field label="Welcome message">
              <input
                className={input}
                maxLength={120}
                value={theme.labels.welcome}
                placeholder="e.g. Selamat datang! Order at your table."
                onChange={(e) => set("labels", { ...theme.labels, welcome: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["callWaiter", "Call waiter button"],
                  ["requestBill", "Request bill button"],
                  ["addToCart", "Add to order button"],
                  ["placeOrder", "Place order button"],
                ] as const
              ).map(([k, l]) => (
                <Field key={k} label={l}>
                  <input className={input} maxLength={30} value={theme.labels[k]} onChange={(e) => set("labels", { ...theme.labels, [k]: e.target.value })} />
                </Field>
              ))}
            </div>
            {canRemoveBranding ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={theme.hideBranding} onChange={(e) => set("hideBranding", e.target.checked)} />
                Hide &quot;Powered by Kopiscan&quot;
              </label>
            ) : (
              <Upsell feature="removeBranding">Remove &quot;Powered by Kopiscan&quot; and put your logo inside the QR codes.</Upsell>
            )}
          </Card>
        )}

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-neutral-200 bg-neutral-50/95 py-3 backdrop-blur">
          <button className={btn.primary} disabled={pending || !dirty || (advanced && issues.length > 0)} onClick={save}>
            {pending ? "Saving…" : "Save branding"}
          </button>
          <button className={btn.ghost} disabled={!dirty} onClick={() => setTheme(initial)}>
            Discard changes
          </button>
          {msg && <span className={cx("text-sm", msg.tone === "ok" ? "text-green-700" : "text-red-700")}>{msg.text}</span>}
        </div>
      </div>

      {/* Live preview: real diner components with the draft theme. transform → fixed children stay inside the frame */}
      <div className="lg:sticky lg:top-32 lg:self-start">
        <div className="mx-auto w-[375px] max-w-full overflow-hidden rounded-[2rem] border-8 border-neutral-900 shadow-xl">
          <div
            className="relative h-[680px] overflow-y-auto [transform:translateZ(0)]"
            style={themeToCssVars(theme) as React.CSSProperties}
          >
            { }
            <link rel="stylesheet" href={googleFontsHref(theme)} />
            <ToastProvider>
              <CartProvider slug={`__preview_${slug}`}>
                <MenuView
                  slug={slug}
                  name={name}
                  theme={theme}
                  menu={menu}
                  logoUrl={theme.assets.logoPath ? `${imageBase}/${theme.assets.logoPath}` : null}
                  coverUrl={advanced && theme.assets.coverPath ? `${imageBase}/${theme.assets.coverPath}` : null}
                  imageBase={imageBase}
                  tableLabel="12"
                  orderingEnabled
                  preview
                />
              </CartProvider>
            </ToastProvider>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-neutral-500">Preview · tap items to see the detail view</p>
      </div>
    </div>
  );
}
