import { NextResponse, type NextRequest } from "next/server";
import { requireMember } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { formatSgTime } from "@/lib/restaurant";
import { allowedDate, getDaySummary } from "@/server/summary";

function csvCell(v: string | number) {
  const s = String(v);
  // neutralise spreadsheet formula injection + quote
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const { restaurant } = await requireMember();
  if (!hasFeature(restaurant.plan, "csvExport")) return new NextResponse("CSV export is a Premium feature.", { status: 403 });
  const date = allowedDate(restaurant.plan, request.nextUrl.searchParams.get("date") ?? undefined);
  if (!date) return new NextResponse("Date not available.", { status: 400 });

  const s = await getDaySummary(restaurant.id, date);
  const lines = [
    ["Order", "Time", "Table", "Status", "Items", "Subtotal (SGD)"].map(csvCell).join(","),
    ...s.orders.map((o) =>
      [o.id.slice(0, 8), formatSgTime(o.created_at), o.table_label, o.status, o.items, (o.subtotal_cents / 100).toFixed(2)].map(csvCell).join(","),
    ),
  ];
  return new NextResponse(`﻿${lines.join("\r\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${restaurant.slug}-orders-${date}.csv"`,
    },
  });
}
