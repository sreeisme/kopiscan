"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartEntry = {
  key: string; // itemId + sorted optionIds
  itemId: string;
  name: string;
  qty: number;
  optionIds: string[];
  optionLabels: string[];
  /** display only — the server recomputes prices */
  unitPriceCents: number;
};

type CartCtx = {
  lines: CartEntry[];
  count: number;
  totalCents: number;
  add: (e: Omit<CartEntry, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  note: string;
  setNote: (n: string) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const storageKey = `kopiscan_cart_${slug}`;
  const [lines, setLines] = useState<CartEntry[]>([]);
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.lines)) setLines(parsed.lines);
        if (typeof parsed.note === "string") setNote(parsed.note);
      }
    } catch {
      /* storage unavailable — cart lives in memory only */
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ lines, note }));
    } catch {
      /* ignore */
    }
  }, [lines, note, loaded, storageKey]);

  const add = useCallback<CartCtx["add"]>((e, qty = 1) => {
    const key = `${e.itemId}:${[...e.optionIds].sort().join(",")}`;
    setLines((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l));
      if (prev.length >= 40) return prev;
      return [...prev, { ...e, key, qty: Math.min(20, qty) }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setNote("");
  }, []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      totalCents: lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0),
      add,
      setQty,
      clear,
      note,
      setNote,
    }),
    [lines, add, setQty, clear, note],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
