"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "./ui";

const STAFF = [
  { href: "/staff", label: "Live orders" },
  { href: "/staff/summary", label: "Daily summary" },
];
const OWNER = [
  { href: "/owner/menu", label: "Menu" },
  { href: "/owner/tables", label: "Tables & QR" },
  { href: "/owner/branding", label: "Branding" },
  { href: "/owner/staff", label: "Staff" },
  { href: "/owner/settings", label: "Settings" },
  { href: "/owner/analytics", label: "Analytics" },
];

export function DashNav({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  const links = isOwner ? [...STAFF, ...OWNER] : STAFF;
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
      {links.map((l) => (
        <NavLink key={l.href} href={l.href} active={path === l.href}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
