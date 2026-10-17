// Seed (or reset) a demo restaurant with menu, modifiers, tables and owner/staff logins.
// Usage: npm run seed -- [--slug demo-kopitiam] [--plan pro]
// Also imported by tests/e2e/global-setup.ts and scripts/seed-super-loco.mjs.
import { createClient } from "@supabase/supabase-js";

const MENU = [
  {
    name: "Mains",
    items: [
      { name: "Hainanese Chicken Rice", price: 650, desc: "Poached chicken, fragrant rice, chilli & ginger.", tags: ["bestseller"], mods: [{ name: "Portion", min: 1, max: 1, opts: [["Regular", 0], ["Large", 150]] }, { name: "Chicken", min: 1, max: 1, opts: [["Steamed", 0], ["Roasted", 0]] }] },
      { name: "Laksa", price: 750, desc: "Spicy coconut curry noodle soup with prawns and cockles.", tags: ["spicy"], mods: [{ name: "Spice level", min: 1, max: 1, opts: [["Mild", 0], ["Normal", 0], ["Extra spicy", 0]] }, { name: "Add-ons", min: 0, max: 3, opts: [["Extra prawns", 200], ["Tau pok", 80], ["Egg", 100]] }] },
      { name: "Nasi Lemak", price: 600, desc: "Coconut rice, sambal, ikan bilis, peanuts, egg.", tags: ["halal", "spicy"] },
      { name: "Char Kway Teow", price: 700, desc: "Wok-fried flat noodles with lup cheong and cockles.", tags: [] },
      { name: "Vegetarian Bee Hoon", price: 550, desc: "Fried rice vermicelli with mock meat and greens.", tags: ["vegetarian"] },
    ],
  },
  {
    name: "Drinks",
    items: [
      { name: "Kopi", price: 180, desc: "Traditional coffee with condensed milk.", tags: [], mods: [{ name: "Temperature", min: 1, max: 1, opts: [["Hot", 0], ["Iced", 50]] }, { name: "Sweetness", min: 1, max: 1, opts: [["Normal", 0], ["Less sweet", 0], ["Kosong (no sugar)", 0]] }] },
      { name: "Teh Tarik", price: 200, desc: "Pulled milk tea.", tags: ["bestseller"] },
      { name: "Lime Juice", price: 250, desc: "Fresh calamansi lime.", tags: ["vegan"] },
      { name: "Bandung", price: 220, desc: "Rose syrup with milk.", tags: [], available: false },
    ],
  },
  {
    name: "Desserts",
    items: [
      { name: "Chendol", price: 350, desc: "Shaved ice, coconut milk, gula melaka, pandan jelly.", tags: ["vegetarian"] },
      { name: "Kaya Toast Set", price: 480, desc: "Kaya & butter toast, 2 soft-boiled eggs, kopi or teh.", tags: ["new"] },
    ],
  },
];

async function ensureUser(db, email, password) {
  for (let page = 1; page <= 50; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const u = data?.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) {
      await db.auth.admin.updateUserById(u.id, { password });
      return u.id;
    }
    if (!data || data.users.length < 1000) break;
  }
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

const must = (r) => {
  if (r.error) throw r.error;
  return r.data;
};

const DEFAULT_SETTINGS = { pricesIncludeTax: false, serviceChargePct: 10, gstPct: 9, orderingEnabled: true };
const DEFAULT_THEME = { labels: { welcome: "Order at your table — we'll bring it over!" } };

/**
 * @param {{ slug?: string, plan?: "basic"|"pro"|"premium", name?: string, ownerEmail?: string, staffEmail?: string, password?: string, tableCount?: number, menu?: typeof MENU, theme?: object, settings?: object }} [opts]
 */
export async function seedDemo({
  slug = "demo-kopitiam",
  plan = "pro",
  name = "Demo Kopitiam",
  ownerEmail,
  staffEmail,
  password,
  tableCount = 6,
  menu = MENU,
  theme = DEFAULT_THEME,
  settings = DEFAULT_SETTINGS,
} = {}) {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  await db.from("restaurants").delete().eq("slug", slug); // cascades everything
  const r = must(
    await db
      .from("restaurants")
      .insert({
        slug,
        name,
        plan,
        settings,
        theme,
      })
      .select("id")
      .single(),
  );

  for (const [ci, cat] of menu.entries()) {
    const c = must(await db.from("menu_categories").insert({ restaurant_id: r.id, name: cat.name, sort: ci }).select("id").single());
    for (const [ii, it] of cat.items.entries()) {
      const item = must(
        await db
          .from("menu_items")
          .insert({ restaurant_id: r.id, category_id: c.id, name: it.name, description: it.desc, price_cents: it.price, tags: it.tags, available: it.available ?? true, sort: ii })
          .select("id")
          .single(),
      );
      for (const [gi, g] of (it.mods ?? []).entries()) {
        const grp = must(
          await db.from("modifier_groups").insert({ restaurant_id: r.id, item_id: item.id, name: g.name, min_select: g.min, max_select: g.max, sort: gi }).select("id").single(),
        );
        must(await db.from("modifier_options").insert(g.opts.map(([n, p], oi) => ({ restaurant_id: r.id, group_id: grp.id, name: n, price_delta_cents: p, sort: oi }))));
      }
    }
  }

  const tables = must(
    await db
      .from("tables")
      .insert(Array.from({ length: tableCount }, (_, i) => ({ restaurant_id: r.id, label: String(i + 1), sort: i })))
      .select("id, label, qr_token, sort")
      .order("sort"),
  );

  const users = {};
  if (ownerEmail && password) {
    users.ownerId = await ensureUser(db, ownerEmail, password);
    must(await db.from("memberships").insert({ user_id: users.ownerId, restaurant_id: r.id, role: "owner" }));
  }
  if (staffEmail && password) {
    users.staffId = await ensureUser(db, staffEmail, password);
    must(await db.from("memberships").insert({ user_id: users.staffId, restaurant_id: r.id, role: "staff" }));
  }
  return { restaurantId: r.id, slug, tables, ...users };
}

// CLI. No `import.meta` / top-level await: Playwright's loader transpiles this file to CommonJS for tests/e2e/global-setup.ts.
if (/seed-demo\.mjs$/.test(process.argv[1] ?? "")) void (async () => {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`);
    return i > 0 ? process.argv[i + 1] : d;
  };
  const res = await seedDemo({
    slug: arg("slug", "demo-kopitiam"),
    plan: arg("plan", "pro"),
    ownerEmail: arg("owner"),
    staffEmail: arg("staff"),
    password: arg("password"),
  });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  console.log(`✔ Seeded ${res.slug}  →  ${site}/r/${res.slug}`);
  console.log("Scan links (open on your phone or in a browser to simulate a table):");
  for (const t of res.tables) console.log(`  Table ${t.label}: ${site}/t/${t.qr_token}`);
})();
