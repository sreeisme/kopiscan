"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { assertLimit } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { check, okVoid, toError, type ActionResult } from "./result";

const Id = z.string().uuid();
const Label = z.string().trim().min(1).max(20);

export async function createTables(input: { labels: string[] }): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const labels = z.array(Label).min(1).max(100).parse(input.labels);
    const supabase = await createClient();
    const { count } = await supabase.from("tables").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id);
    // check the whole batch fits
    assertLimit(restaurant.plan, "tables", (count ?? 0) + labels.length - 1);
    check(await supabase.from("tables").insert(labels.map((label, i) => ({ restaurant_id: restaurant.id, label, sort: (count ?? 0) + i }))));
    revalidatePath("/owner/tables");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function updateTable(id: string, input: { label?: string; active?: boolean }): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const v = z.object({ label: Label.optional(), active: z.boolean().optional() }).parse(input);
    const supabase = await createClient();
    check(await supabase.from("tables").update(v).eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    revalidatePath("/owner/tables");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

/** New QR token: previously printed codes for this table stop working immediately. */
export async function rotateTableToken(id: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const supabase = await createClient();
    const token = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
    check(await supabase.from("tables").update({ qr_token: token }).eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    // also end live sessions created from the old code
    check(
      await supabase.from("table_sessions").update({ closed_at: new Date().toISOString() }).eq("table_id", id).is("closed_at", null),
    );
    revalidatePath("/owner/tables");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function deleteTable(id: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember({ role: "owner" });
    const supabase = await createClient();
    check(await supabase.from("tables").delete().eq("id", Id.parse(id)).eq("restaurant_id", restaurant.id));
    revalidatePath("/owner/tables");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}
