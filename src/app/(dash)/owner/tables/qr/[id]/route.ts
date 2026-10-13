import { NextResponse, type NextRequest } from "next/server";
import { requireMember } from "@/lib/auth";
import { storageUrl } from "@/lib/env";
import { hasFeature } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTheme } from "@/lib/theme/resolve";
import { tableQrPng, tableQrSvg } from "@/server/qr";

/** Download a table's QR as PNG (print shops) or SVG (vector). Owner only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { restaurant } = await requireMember({ role: "owner" });
  const { id } = await params;
  const { data: table } = await createAdminClient()
    .from("tables")
    .select("label, qr_token")
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (!table) return new NextResponse("Not found", { status: 404 });

  const filename = `${restaurant.slug}-table-${table.label}`.replace(/[^a-zA-Z0-9-_]/g, "_");
  if (request.nextUrl.searchParams.get("format") === "svg") {
    const theme = resolveTheme(restaurant.theme, restaurant.plan);
    const logo = hasFeature(restaurant.plan, "brandedQr") ? storageUrl(theme.assets.logoPath) : null;
    return new NextResponse(await tableQrSvg(table.qr_token, { logoUrl: logo }), {
      headers: { "content-type": "image/svg+xml", "content-disposition": `attachment; filename="${filename}.svg"` },
    });
  }
  return new NextResponse(new Uint8Array(await tableQrPng(table.qr_token)), {
    headers: { "content-type": "image/png", "content-disposition": `attachment; filename="${filename}.png"` },
  });
}
