"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { check, okVoid, toError, type ActionResult } from "./result";

const Id = z.string().uuid();
const OrderStatus = z.enum(["acknowledged", "done", "cancelled", "new"]);

/** Uses the RLS-scoped client: staff can only touch their own restaurant's rows, status column only. */
export async function setOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember();
    const id = Id.parse(orderId);
    const s = OrderStatus.parse(status);
    const supabase = await createClient();
    check(await supabase.from("orders").update({ status: s }).eq("id", id).eq("restaurant_id", restaurant.id));
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

export async function resolveRequest(requestId: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember();
    const supabase = await createClient();
    check(
      await supabase.from("service_requests").update({ status: "done" }).eq("id", Id.parse(requestId)).eq("restaurant_id", restaurant.id),
    );
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}

/**
 * "Bill paid / table cleared": ends every open diner session on the table so a
 * departed diner can't keep ordering, and clears any open requests.
 */
export async function closeTable(tableId: string): Promise<ActionResult> {
  try {
    const { restaurant } = await requireMember();
    const id = Id.parse(tableId);
    const supabase = await createClient();
    check(
      await supabase
        .from("table_sessions")
        .update({ closed_at: new Date().toISOString() })
        .eq("table_id", id)
        .eq("restaurant_id", restaurant.id)
        .is("closed_at", null),
    );
    check(
      await supabase.from("service_requests").update({ status: "done" }).eq("table_id", id).eq("restaurant_id", restaurant.id).eq("status", "open"),
    );
    revalidatePath("/staff");
    return okVoid;
  } catch (e) {
    return toError(e);
  }
}
