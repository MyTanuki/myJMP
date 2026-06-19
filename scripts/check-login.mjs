// Diagnose login against the Turso database directly.
// Usage: node scripts/check-login.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.argv[2] ?? process.env.TURSO_DATABASE_URL;
const authToken = process.argv[3] ?? process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Usage: node scripts/check-login.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>");
  process.exit(1);
}

const db = createClient({ url, authToken });
const res = await db.execute("SELECT email, passwordHash, role FROM User");
console.log(`Users in Turso: ${res.rows.length}`);
for (const r of res.rows) {
  const hash = String(r.passwordHash ?? "");
  let ok = false;
  try {
    ok = await bcrypt.compare("123456", hash);
  } catch (e) {
    console.log(`  bcrypt error for ${r.email}: ${e.message}`);
  }
  console.log(
    `- ${r.email}  role=${r.role}  password '123456' matches: ${ok}  (hash length ${hash.length}, should be 60)`
  );
}
