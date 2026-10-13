import type { MenuCategory } from "@/server/diner-data";
import type { Theme } from "@/lib/theme/schema";

/** Everything the diner UI needs. Plain data so it can also be rendered in the owner's live preview. */
export type DinerProps = {
  slug: string;
  name: string;
  theme: Theme;
  menu: MenuCategory[];
  logoUrl: string | null;
  coverUrl: string | null;
  /** storage base so components can build image URLs without env access */
  imageBase: string;
  tableLabel: string | null;
  orderingEnabled: boolean;
  /** owner branding preview: no network calls, no navigation */
  preview?: boolean;
};
