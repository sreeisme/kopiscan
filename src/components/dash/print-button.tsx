"use client";

import { btn } from "./ui";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button className={`${btn.primary} no-print`} onClick={() => window.print()}>
      🖨 {label}
    </button>
  );
}
