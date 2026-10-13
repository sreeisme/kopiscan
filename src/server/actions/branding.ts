"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { parseSettings, SettingsSchema } from "@/lib/restaurant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME } from "@/lib/theme/defaults";
import { checkThemeContrast, contrastRatio } from "@/lib/theme/contrast";
import { PRESETS } from "@/lib/theme/presets";
import { ThemeSchema, type Theme } from "@/lib/theme/schema";
import { check, okVoid, toError, type ActionResult } from "./result";

const BasicInput = z.object({
  presetId: z.string(),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoPath: z.string().max(300).nullable(),
});

/**
 * Save branding.
 * - Pro/Premium: full Theme (validated + contrast-checked).
 * - Basic: preset + primary colour + logo only; everything else is derived server-side.
 */
export async function saveTheme(input: { theme?: unknown; basic?: unknown }): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    let theme: Theme;

    if (hasFeature(restaurant.plan, "themeAdvanced")) {
      const parsed = ThemeSchema.safeParse(input.theme);
      if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid theme" };
      theme = parsed.data;
      if (!hasFeature(restaurant.plan, "removeBranding")) theme.hideBranding = false;
    } else {
      const b = BasicInput.parse(input.basic);
      const preset = PRESETS.find((p) => p.id === b.presetId) ?? PRESETS[0];
      // pick black/white button text for the chosen primary
      const onPrimary = contrastRatio("#FFFFFF", b.primary) >= contrastRatio("#111111", b.primary) ? "#FFFFFF" : "#111111";
      theme = {
        ...DEFAULT_THEME,
        colors: { ...preset.colors, primary: b.primary, onPrimary },
        font: preset.font,
        radius: preset.radius,
        assets: { logoPath: b.logoPath, coverPath: null },
      };
    }

    for (const p of [theme.assets.logoPath, theme.assets.coverPath])
      if (p && !p.startsWith(`${restaurant.id}/`)) return { ok: false, error: "Invalid image." };

    const issues = checkThemeContrast(theme.colors);
    if (issues.length)
      return { ok: false, code: "CONTRAST", error: `Hard to read: ${issues.map((i) => `${i.pair} (${i.ratio}:1, needs ${i.min}:1)`).join(", ")}` };

    const supabase = await createClient();
    check(await supabase.from("restaurants").update({ theme }).eq("id", restaurant.id));
    revalidatePath(`/r/${restaurant.slug}`, "layout");
    revalidatePath("/owner/branding");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const v = SettingsSchema.partial().extend({ name: z.string().trim().min(1).max(80).optional() }).parse(input);
    const { name, ...settings } = v;
    const supabase = await createClient();
    check(
      await supabase
        .from("restaurants")
        .update({ ...(name ? { name } : {}), settings: { ...parseSettings(restaurant.settings), ...settings } })
        .eq("id", restaurant.id),
    );
    revalidatePath(`/r/${restaurant.slug}`, "layout");
    revalidatePath("/owner/settings");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

/** Pause/resume ordering — available to staff too (kitchen overwhelmed, closing time). */
export async function setOrderingEnabled(enabled: boolean): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember();
    check(
      await createAdminClient()
        .from("restaurants")
        .update({ settings: { ...parseSettings(restaurant.settings), orderingEnabled: !!enabled } })
        .eq("id", restaurant.id),
    );
    revalidatePath(`/r/${restaurant.slug}`, "layout");
    revalidatePath("/staff");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}
