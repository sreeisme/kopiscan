"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TAG_LABELS, TAGS, type Tag } from "@/lib/menu-tags";
import { formatSgd } from "@/lib/pricing";
import type { MenuCategory, MenuItem } from "@/server/diner-data";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  reorder,
  saveItemModifiers,
  setItemAvailable,
  updateCategory,
  updateItem,
} from "@/server/actions/menu";
import type { ActionResult } from "@/server/actions/result";
import { ImageUpload } from "./image-upload";
import { btn, Card, cx, Field, input, Upsell } from "./ui";

type Props = {
  restaurantId: string;
  menu: MenuCategory[];
  imageBase: string;
  modifiersEnabled: boolean;
  atItemLimit: boolean;
};

export function MenuEditor({ restaurantId, menu, imageBase, modifiersEnabled, atItemLimit }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ item: MenuItem | null; categoryId: string } | null>(null);
  const [newCat, setNewCat] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult<unknown>>, after?: () => void) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else {
        after?.();
        router.refresh();
      }
    });
  }

  function move<T extends { id: string }>(list: T[], idx: number, dir: -1 | 1, table: "menu_categories" | "menu_items") {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((x) => x.id);
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    run(() => reorder(table, ids));
  }

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

      <Card className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Field label="New category">
            <input className={input} value={newCat} maxLength={60} placeholder="e.g. Mains, Drinks, Desserts" onChange={(e) => setNewCat(e.target.value)} />
          </Field>
        </div>
        <button
          className={btn.primary}
          disabled={pending || !newCat.trim()}
          onClick={() => run(() => createCategory({ name: newCat }), () => setNewCat(""))}
        >
          Add category
        </button>
      </Card>

      {menu.length === 0 && <p className="py-8 text-center text-neutral-500">Start by adding a category above.</p>}

      {menu.map((cat, ci) => (
        <Card key={cat.id} className={cx(!cat.visible && "opacity-70")}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {renaming?.id === cat.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => updateCategory(cat.id, { name: renaming.name }), () => setRenaming(null));
                }}
              >
                <input className={input} autoFocus value={renaming.name} maxLength={60} onChange={(e) => setRenaming({ id: cat.id, name: e.target.value })} />
                <button className={btn.primary}>Save</button>
                <button type="button" className={btn.ghost} onClick={() => setRenaming(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <h2 className="flex-1 text-lg font-semibold">
                {cat.name} {!cat.visible && <span className="text-sm font-normal text-neutral-500">(hidden)</span>}
              </h2>
            )}
            <button className={btn.ghost} aria-label="Move category up" onClick={() => move(menu, ci, -1, "menu_categories")} disabled={ci === 0 || pending}>
              ↑
            </button>
            <button
              className={btn.ghost}
              aria-label="Move category down"
              onClick={() => move(menu, ci, 1, "menu_categories")}
              disabled={ci === menu.length - 1 || pending}
            >
              ↓
            </button>
            <button className={btn.ghost} onClick={() => setRenaming({ id: cat.id, name: cat.name })}>
              Rename
            </button>
            <button className={btn.ghost} onClick={() => run(() => updateCategory(cat.id, { visible: !cat.visible }))}>
              {cat.visible ? "Hide" : "Show"}
            </button>
            {confirmDelete === cat.id ? (
              <>
                <button className={btn.danger} onClick={() => run(() => deleteCategory(cat.id), () => setConfirmDelete(null))}>
                  Delete {cat.items.length} items too?
                </button>
                <button className={btn.ghost} onClick={() => setConfirmDelete(null)}>
                  Keep
                </button>
              </>
            ) : (
              <button className={btn.ghost} onClick={() => setConfirmDelete(cat.id)}>
                Delete
              </button>
            )}
          </div>

          <ul className="divide-y divide-neutral-100">
            {cat.items.map((item, ii) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                {item.image_path ? (
                  <img src={`${imageBase}/${item.image_path}`} alt="" className="size-12 rounded-lg object-cover" />
                ) : (
                  <div className="size-12 rounded-lg bg-neutral-100" />
                )}
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing({ item, categoryId: cat.id })}>
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="text-sm text-neutral-500">
                    {formatSgd(item.price_cents)}
                    {item.groups.length > 0 && ` · ${item.groups.length} option group${item.groups.length > 1 ? "s" : ""}`}
                  </div>
                </button>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={(e) => run(() => setItemAvailable(item.id, e.target.checked))}
                    className="size-4"
                  />
                  <span className={item.available ? "text-neutral-700" : "font-semibold text-red-700"}>{item.available ? "Available" : "Sold out"}</span>
                </label>
                <button className={btn.ghost} aria-label="Move item up" onClick={() => move(cat.items, ii, -1, "menu_items")} disabled={ii === 0 || pending}>
                  ↑
                </button>
                <button
                  className={btn.ghost}
                  aria-label="Move item down"
                  onClick={() => move(cat.items, ii, 1, "menu_items")}
                  disabled={ii === cat.items.length - 1 || pending}
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>
          <button
            className={`${btn.secondary} mt-3`}
            disabled={atItemLimit}
            title={atItemLimit ? "Item limit reached for your plan" : undefined}
            onClick={() => setEditing({ item: null, categoryId: cat.id })}
          >
            + Add item
          </button>
        </Card>
      ))}

      {atItemLimit && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You&apos;ve reached your plan&apos;s item limit. Contact us to upgrade for more items.
        </p>
      )}

      {editing && (
        <ItemDialog
          restaurantId={restaurantId}
          imageBase={imageBase}
          categories={menu}
          item={editing.item}
          categoryId={editing.categoryId}
          modifiersEnabled={modifiersEnabled}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

type GroupDraft = {
  name: string;
  min_select: number;
  max_select: number;
  options: { name: string; price: string; available: boolean }[];
};

const toCents = (s: string) => Math.round(parseFloat(s || "0") * 100);

function ItemDialog({
  restaurantId,
  imageBase,
  categories,
  item,
  categoryId,
  modifiersEnabled,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  imageBase: string;
  categories: MenuCategory[];
  item: MenuItem | null;
  categoryId: string;
  modifiersEnabled: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? (item.price_cents / 100).toFixed(2) : "");
  const [cat, setCat] = useState(item?.category_id ?? categoryId);
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [image, setImage] = useState<string | null>(item?.image_path ?? null);
  const [groups, setGroups] = useState<GroupDraft[]>(
    item?.groups.map((g) => ({
      name: g.name,
      min_select: g.min_select,
      max_select: g.max_select,
      options: g.options.map((o) => ({ name: o.name, price: (o.price_delta_cents / 100).toFixed(2), available: o.available })),
    })) ?? [],
  );
  const [err, setErr] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    setErr(null);
    const priceCents = toCents(price);
    if (!name.trim()) return setErr("Name is required.");
    if (!/^\d+(\.\d{1,2})?$/.test(price.trim())) return setErr("Enter a price like 8.50");
    start(async () => {
      const payload = { category_id: cat, name, description, price_cents: priceCents, tags, image_path: image };
      let id = item?.id;
      if (item) {
        const r = await updateItem(item.id, payload);
        if (!r.ok) return setErr(r.error);
      } else {
        const r = await createItem(payload);
        if (!r.ok) return setErr(r.error);
        id = r.data.id;
      }
      if (modifiersEnabled && id) {
        const r = await saveItemModifiers(
          id,
          groups.map((g) => ({
            name: g.name,
            min_select: g.min_select,
            max_select: g.max_select,
            options: g.options.map((o) => ({ name: o.name, price_delta_cents: toCents(o.price), available: o.available })),
          })),
        );
        if (!r.ok) return setErr(`Item saved, but options failed: ${r.error}`);
      }
      onSaved();
    });
  }

  function remove() {
    if (!item) return;
    start(async () => {
      const r = await deleteItem(item.id);
      if (!r.ok) return setErr(r.error);
      onSaved();
    });
  }

  const updGroup = (i: number, patch: Partial<GroupDraft>) => setGroups((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{item ? "Edit item" : "New item"}</h2>
          <button className={btn.ghost} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input className={input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Price (S$)">
            <input className={input} inputMode="decimal" value={price} placeholder="8.50" onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={input} value={cat} onChange={(e) => setCat(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Photo">
            <ImageUpload restaurantId={restaurantId} folder="items" value={image} imageBase={imageBase} onChange={setImage} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className={input} rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div>
          <div className="mb-1 text-sm font-medium">Tags</div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <label key={t} className={cx("cursor-pointer rounded-full border px-3 py-1 text-sm", tags.includes(t) ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300")}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={tags.includes(t)}
                  onChange={(e) => setTags((cur) => (e.target.checked ? [...cur, t] : cur.filter((x) => x !== t)))}
                />
                {TAG_LABELS[t as Tag]}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Options &amp; add-ons</div>
            {modifiersEnabled && groups.length < 10 && (
              <button
                className={btn.secondary}
                onClick={() => setGroups((g) => [...g, { name: "", min_select: 1, max_select: 1, options: [{ name: "", price: "0.00", available: true }] }])}
              >
                + Option group
              </button>
            )}
          </div>
          {!modifiersEnabled && <Upsell feature="modifiers">Add sizes, spice levels and paid add-ons to items.</Upsell>}
          {modifiersEnabled &&
            groups.map((g, gi) => (
              <div key={gi} className="space-y-2 rounded-xl border border-neutral-200 p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <Field label="Group name">
                      <input className={input} value={g.name} placeholder="e.g. Size, Spice level, Add-ons" onChange={(e) => updGroup(gi, { name: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Min">
                    <input className={`${input} w-16`} type="number" min={0} max={20} value={g.min_select} onChange={(e) => updGroup(gi, { min_select: +e.target.value })} />
                  </Field>
                  <Field label="Max">
                    <input className={`${input} w-16`} type="number" min={1} max={20} value={g.max_select} onChange={(e) => updGroup(gi, { max_select: +e.target.value })} />
                  </Field>
                  <button className={btn.ghost} onClick={() => setGroups((gs) => gs.filter((_, j) => j !== gi))}>
                    Remove group
                  </button>
                </div>
                <p className="text-xs text-neutral-500">Min 1 / Max 1 = required single choice. Min 0 = optional.</p>
                {g.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      className={input}
                      value={o.name}
                      placeholder="Option name"
                      onChange={(e) => updGroup(gi, { options: g.options.map((x, k) => (k === oi ? { ...x, name: e.target.value } : x)) })}
                    />
                    <input
                      className={`${input} w-28`}
                      inputMode="decimal"
                      value={o.price}
                      aria-label="Extra price"
                      onChange={(e) => updGroup(gi, { options: g.options.map((x, k) => (k === oi ? { ...x, price: e.target.value } : x)) })}
                    />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={o.available}
                        onChange={(e) => updGroup(gi, { options: g.options.map((x, k) => (k === oi ? { ...x, available: e.target.checked } : x)) })}
                      />
                      Avail.
                    </label>
                    <button
                      className={btn.ghost}
                      aria-label="Remove option"
                      disabled={g.options.length === 1}
                      onClick={() => updGroup(gi, { options: g.options.filter((_, k) => k !== oi) })}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button className={btn.ghost} onClick={() => updGroup(gi, { options: [...g.options, { name: "", price: "0.00", available: true }] })}>
                  + Add option
                </button>
              </div>
            ))}
        </div>

        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{err}</p>}

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
          <button className={btn.primary} onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save item"}
          </button>
          <button className={btn.secondary} onClick={onClose}>
            Cancel
          </button>
          {item &&
            (confirmDel ? (
              <button className={`${btn.danger} ml-auto`} onClick={remove} disabled={pending}>
                Yes, delete {item.name}
              </button>
            ) : (
              <button className={`${btn.ghost} ml-auto text-red-700`} onClick={() => setConfirmDel(true)}>
                Delete item
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
