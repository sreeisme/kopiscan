import "server-only";
import QRCode from "qrcode";
import { publicEnv } from "@/lib/env";

export function tableUrl(qrToken: string) {
  return `${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/t/${qrToken}`;
}

/**
 * SVG QR for a table. With `logoUrl` (Premium branded QR) we use error-correction H
 * (30% recoverable) and cover ≤ ~20% of the centre with the logo, which stays scannable.
 */
export async function tableQrSvg(qrToken: string, opts: { logoUrl?: string | null; color?: string } = {}): Promise<string> {
  const svg = await QRCode.toString(tableUrl(qrToken), {
    type: "svg",
    errorCorrectionLevel: opts.logoUrl ? "H" : "M",
    margin: 2,
    color: { dark: opts.color ?? "#000000", light: "#ffffff" },
  });
  if (!opts.logoUrl) return svg;

  // Embed the logo so the SVG is self-contained (print shops, offline editors).
  let href = opts.logoUrl;
  try {
    const res = await fetch(opts.logoUrl, { next: { revalidate: 3600 } });
    if (res.ok) href = `data:${res.headers.get("content-type") ?? "image/webp"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    /* fall back to the remote URL */
  }

  const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  const size = vb ? Number(vb[1]) : 33;
  const box = size * 0.22;
  const pos = (size - box) / 2;
  const pad = box * 0.08;
  const logo =
    `<rect x="${pos}" y="${pos}" width="${box}" height="${box}" rx="${box * 0.15}" fill="#fff"/>` +
    `<image href="${href.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" x="${pos + pad}" y="${pos + pad}" width="${box - 2 * pad}" height="${box - 2 * pad}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace("</svg>", `${logo}</svg>`);
}

export async function tableQrPng(qrToken: string): Promise<Buffer> {
  return QRCode.toBuffer(tableUrl(qrToken), { type: "png", errorCorrectionLevel: "M", margin: 2, width: 1024 });
}
