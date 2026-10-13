"use client";

import { useTransition } from "react";
import { switchRestaurant } from "@/server/actions/team";

export function RestaurantSwitcher({
  current,
  name,
  memberships,
}: {
  current: string;
  name: string;
  memberships: { restaurant_id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  if (memberships.length <= 1) return <span className="font-semibold text-neutral-800">{name}</span>;
  return (
    <select
      aria-label="Restaurant"
      className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm font-semibold"
      value={current}
      disabled={pending}
      onChange={(e) => start(() => switchRestaurant(e.target.value))}
    >
      {!memberships.some((m) => m.restaurant_id === current) && <option value={current}>{name}</option>}
      {memberships.map((m) => (
        <option key={m.restaurant_id} value={m.restaurant_id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
