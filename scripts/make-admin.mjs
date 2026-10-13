// Make a user a platform admin (creates the user if needed).
// Usage: npm run make-admin -- you@example.com [password]
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npm run make-admin -- email [password]");
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function findUser(email) {
  for (let page = 1; page <= 50; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const u = data?.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (!data || data.users.length < 1000) return null;
  }
  return null;
}

let user = await findUser(email);
if (!user) {
  if (!password || password.length < 10) {
    console.error("User does not exist. Pass a password (10+ chars) to create it.");
    process.exit(1);
  }
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
  console.log("Created user", email);
} else if (password) {
  const { error } = await db.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;
  console.log("Updated password for", email);
}
const { error } = await db.from("platform_admins").upsert({ user_id: user.id });
if (error) throw error;
console.log(`✔ ${email} is now a platform admin. Sign in at /login, then open /admin.`);
