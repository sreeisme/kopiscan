"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { btn } from "./ui";

/** Downscale + re-encode to WebP in the browser so diners on mobile data get small images. */
async function compress(file: File, maxSize: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/webp", 0.82));
}

export function ImageUpload({
  restaurantId,
  folder,
  value,
  imageBase,
  onChange,
  maxSize = 1200,
  label = "Upload image",
}: {
  restaurantId: string;
  folder: "items" | "brand";
  value: string | null;
  imageBase: string;
  onChange: (path: string | null) => void;
  maxSize?: number;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File) {
    setErr(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setErr("Use a JPG, PNG or WebP image.");
    if (file.size > 15 * 1024 * 1024) return setErr("Image is too large (max 15 MB).");
    setBusy(true);
    try {
      const blob = await compress(file, maxSize);
      const path = `${restaurantId}/${folder}/${crypto.randomUUID()}.webp`;
      const { error } = await createClient().storage.from("menu-assets").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;
      onChange(path);
    } catch {
      setErr("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={`${imageBase}/${value}`} alt="" className="size-16 rounded-lg border border-neutral-200 object-cover" />
      ) : (
        <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-400">None</div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button type="button" className={btn.secondary} disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Uploading…" : label}
          </button>
          {value && (
            <button type="button" className={btn.ghost} onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
        {err && <span className="text-xs text-red-700">{err}</span>}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
