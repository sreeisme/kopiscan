import { StaffBoard } from "@/components/dash/staff-board";
import { requireMember } from "@/lib/auth";
import { parseSettings, sgDayRange, sgToday } from "@/lib/restaurant";

export const metadata = { title: "Live orders" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const { restaurant } = await requireMember();
  const { from } = sgDayRange(sgToday());
  return (
    <StaffBoard
      restaurantId={restaurant.id}
      since={from}
      orderingEnabled={parseSettings(restaurant.settings).orderingEnabled}
    />
  );
}
