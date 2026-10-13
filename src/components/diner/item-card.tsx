import { TAG_LABELS, type Tag } from "@/lib/menu-tags";
import { formatSgd } from "@/lib/pricing";
import type { Theme } from "@/lib/theme/schema";
import type { MenuItem } from "@/server/diner-data";

export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="rounded-m border border-m-accent px-2 py-0.5 text-[11px] font-medium text-m-text">
          {TAG_LABELS[t as Tag] ?? t}
        </span>
      ))}
    </div>
  );
}

type CardProps = { item: MenuItem; theme: Theme; imageBase: string; onOpen: () => void };

function img(item: MenuItem, theme: Theme, base: string) {
  return theme.toggles.showImages && item.image_path ? `${base}/${item.image_path}` : null;
}

function SoldOut() {
  return <span className="rounded-m bg-m-text px-2 py-0.5 text-[11px] font-semibold text-m-bg">Sold out</span>;
}

/** Layout variant: compact rows, image on the right. */
export function ListCard({ item, theme, imageBase, onOpen }: CardProps) {
  const src = img(item, theme, imageBase);
  return (
    <button onClick={onOpen} className={`flex w-full gap-3 py-4 text-left ${item.available ? "" : "opacity-60"}`}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-m-heading font-semibold">{item.name}</div>
        {theme.toggles.showDescriptions && item.description && <p className="line-clamp-2 text-sm text-m-muted">{item.description}</p>}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-semibold">{formatSgd(item.price_cents)}</span>
          {!item.available && <SoldOut />}
        </div>
        {theme.toggles.showTags && <TagList tags={item.tags} />}
      </div>
      {src && <img src={src} alt="" loading="lazy" className="size-24 shrink-0 rounded-m object-cover" />}
    </button>
  );
}

/** Layout variant: 2-column tiles. */
export function GridCard({ item, theme, imageBase, onOpen }: CardProps) {
  const src = img(item, theme, imageBase);
  return (
    <button onClick={onOpen} className={`flex flex-col overflow-hidden rounded-m bg-m-surface text-left shadow-sm ${item.available ? "" : "opacity-60"}`}>
      {src ? <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" /> : <div className="aspect-[3/1] w-full bg-m-primary/10" />}
      <div className="space-y-1 p-3">
        <div className="font-m-heading text-sm font-semibold leading-tight">{item.name}</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{formatSgd(item.price_cents)}</span>
          {!item.available && <SoldOut />}
        </div>
      </div>
    </button>
  );
}

/** Layout variant: large photo-forward cards. */
export function BigCard({ item, theme, imageBase, onOpen }: CardProps) {
  const src = img(item, theme, imageBase);
  return (
    <button onClick={onOpen} className={`w-full overflow-hidden rounded-m bg-m-surface text-left shadow-sm ${item.available ? "" : "opacity-60"}`}>
      {src && <img src={src} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />}
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="font-m-heading text-lg font-semibold">{item.name}</div>
          <span className="shrink-0 font-semibold">{formatSgd(item.price_cents)}</span>
        </div>
        {theme.toggles.showDescriptions && item.description && <p className="text-sm text-m-muted">{item.description}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {!item.available && <SoldOut />}
          {theme.toggles.showTags && <TagList tags={item.tags} />}
        </div>
      </div>
    </button>
  );
}
