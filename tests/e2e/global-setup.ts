import { writeFileSync } from "node:fs";
import path from "node:path";
// plain JS seed script shared with `npm run seed`
import { seedDemo } from "../../scripts/seed-demo.mjs";
import { PASSWORD } from "./fixture";

const FIXTURE_FILE = path.join(__dirname, ".fixture.json");

export default async function globalSetup() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("E2E needs .env.local pointing at a DEV Supabase project");
  const pro = await seedDemo({
    slug: "e2e-pro",
    plan: "pro",
    name: "E2E Pro Diner",
    ownerEmail: "e2e-owner@kopiscan.test",
    staffEmail: "e2e-staff@kopiscan.test",
    password: PASSWORD,
  });
  const basic = await seedDemo({ slug: "e2e-basic", plan: "basic", name: "E2E Basic", tableCount: 10 });
  writeFileSync(FIXTURE_FILE, JSON.stringify({ pro, basic }, null, 2));
}
