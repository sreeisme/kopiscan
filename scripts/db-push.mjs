// Apply supabase/migrations to the remote database.
// Usage: npm run db:push   (reads SUPABASE_DB_URL from .env.local)
import { spawnSync } from "node:child_process";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}
const args = process.argv.includes("--types")
  ? ["supabase", "gen", "types", "typescript", "--db-url", url, "--schema", "public"]
  : ["supabase", "db", "push", "--db-url", url, "--include-all"];
const r = spawnSync("npx", args, { stdio: process.argv.includes("--types") ? ["inherit", "pipe", "inherit"] : "inherit", shell: true });
if (process.argv.includes("--types") && r.status === 0) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync("src/lib/database.types.ts", r.stdout);
  console.log("Wrote src/lib/database.types.ts");
}
process.exit(r.status ?? 1);
