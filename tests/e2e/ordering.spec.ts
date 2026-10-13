import { expect, test } from "@playwright/test";
import { fixture, login, serviceDb, STAFF } from "./fixture";

test.describe.configure({ mode: "serial" });

test("diner scans, orders with modifiers; staff sees it live and completes it", async ({ page, browser }) => {
  const { pro } = fixture();
  const table = pro.tables[0];

  // Staff opens the board first (separate browser context = separate device)
  const staffCtx = await browser.newContext();
  const staff = await staffCtx.newPage();
  await login(staff, STAFF);
  await expect(staff.getByText("● Live")).toBeVisible({ timeout: 20_000 });

  // Diner scans
  await page.goto(`/t/${table.qr_token}`);
  await expect(page).toHaveURL(new RegExp(`/r/${pro.slug}$`));
  await expect(page.getByText(`Table ${table.label}`)).toBeVisible();

  // Item with required modifiers (preselected) + optional add-on
  await page.getByRole("button", { name: /Laksa/ }).click();
  await page.getByLabel("Extra spicy").check();
  await page.getByLabel("Extra prawns").check();
  await page.getByRole("button", { name: /Add to order · S\$9\.50/ }).click();

  // Simple item
  await page.getByRole("button", { name: /Teh Tarik/ }).click();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: /Add to order · S\$4\.00/ }).click();

  await page.getByRole("link", { name: /View order · 3/ }).click();
  await page.getByPlaceholder(/less spicy/).fill("No cockles please");
  await page.getByRole("button", { name: /Place order · S\$13\.50/ }).click();
  await expect(page.getByRole("heading", { name: "Order received!" })).toBeVisible();

  // Staff side
  const card = staff.locator("article", { hasText: "No cockles please" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Extra spicy, Extra prawns")).toBeVisible();
  await card.getByRole("button", { name: "Acknowledge" }).click();
  await staff.locator("article", { hasText: "No cockles please" }).getByRole("button", { name: "Mark done" }).click();

  // Diner sees status update via polling
  await expect(page.getByText("Served").first()).toBeVisible({ timeout: 20_000 });
  await staffCtx.close();
});

test("server ignores client prices and rejects sold-out items", async ({ page }) => {
  const { pro } = fixture();
  await page.goto(`/t/${pro.tables[1].qr_token}`);
  // tamper with the stored cart: fake price + a sold-out item
  const db = serviceDb();
  const { data: items } = await db.from("menu_items").select("id, name").eq("restaurant_id", pro.restaurantId).in("name", ["Nasi Lemak", "Bandung"]);
  const nasi = items!.find((i) => i.name === "Nasi Lemak")!;
  const bandung = items!.find((i) => i.name === "Bandung")!;
  await page.evaluate(
    ([slug, nasiId, bandungId]) => {
      localStorage.setItem(
        `kopiscan_cart_${slug}`,
        JSON.stringify({
          lines: [
            { key: `${nasiId}:`, itemId: nasiId, name: "Nasi Lemak", qty: 1, optionIds: [], optionLabels: [], unitPriceCents: 1 },
            { key: `${bandungId}:`, itemId: bandungId, name: "Bandung", qty: 1, optionIds: [], optionLabels: [], unitPriceCents: 1 },
          ],
          note: "",
        }),
      );
    },
    [pro.slug, nasi.id, bandung.id],
  );
  await page.goto(`/r/${pro.slug}/cart`);
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Bandung is sold out" })).toBeVisible();

  // remove the sold-out line and resubmit: server price (S$6.00) wins over the fake S$0.01
  await page.getByRole("button", { name: "Remove one Bandung" }).click();
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByRole("heading", { name: "Order received!" })).toBeVisible();
  await expect(page.getByText("S$6.00").first()).toBeVisible();
});

test("call waiter is de-duplicated and appears for staff; clearing the table ends the session", async ({ page, browser }) => {
  const { pro } = fixture();
  const table = pro.tables[2];
  await page.goto(`/t/${table.qr_token}`);
  await page.getByRole("button", { name: /Call waiter/ }).click();
  await expect(page.getByText("A staff member is on the way.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Staff notified/ })).toBeDisabled();

  const db = serviceDb();
  const { count } = await db.from("service_requests").select("id", { count: "exact", head: true }).eq("table_id", table.id).eq("status", "open");
  expect(count).toBe(1);

  await page.getByRole("button", { name: /Request bill/ }).click();
  const staffCtx = await browser.newContext();
  const staff = await staffCtx.newPage();
  await login(staff, STAFF);
  const bill = staff.locator("div", { hasText: `Table ${table.label}` }).filter({ hasText: "Bill requested" }).last();
  await expect(bill).toBeVisible();
  await bill.getByRole("button", { name: /Paid · clear table/ }).click();
  await expect(staff.getByText("Bill requested")).toHaveCount(0);
  await staffCtx.close();

  // Diner's session is now closed → can't order any more
  await page.goto(`/r/${pro.slug}/cart`);
  await expect(page.getByText(/table session has ended/)).toBeVisible();
});

test("rotated QR codes stop working", async ({ page }) => {
  const { pro } = fixture();
  const table = pro.tables[3];
  const db = serviceDb();
  await db.from("tables").update({ qr_token: `rotated-${Date.now()}-abcdefgh` }).eq("id", table.id);
  await page.goto(`/t/${table.qr_token}`);
  await expect(page).toHaveURL(/scan-invalid/);
});

test("menu is browsable without a session but ordering needs a scan", async ({ browser }) => {
  const { pro } = fixture();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/r/${pro.slug}`);
  await expect(page.getByText(/Scan the QR code on your table/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Call waiter/ })).toHaveCount(0);
  await ctx.close();
});
