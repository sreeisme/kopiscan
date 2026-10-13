import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

type Seeded = { restaurantId: string; slug: string; tables: { id: string; label: string; qr_token: string }[] };
export const fixture = (): { pro: Seeded; basic: Seeded } => JSON.parse(readFileSync(path.join(__dirname, ".fixture.json"), "utf8"));

export const PASSWORD = "e2e-Test-Password-123";
export const OWNER = "e2e-owner@menuly.test";
export const STAFF = "e2e-staff@menuly.test";

export const serviceDb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
export const anonDb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/staff/);
}
