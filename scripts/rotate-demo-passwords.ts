/**
 * One-time fix: scripts/migrate-sqlite.ts gave every migrated account except
 * the owner's the password "velvet". That was inert while sign-in was Google
 * only, but email + password sign-in is back (#92), so anyone who knows a
 * migrated member's email could sign in as them.
 *
 * For every account, this tries "velvet" against Supabase. Where it works,
 * the password is replaced with a long random one that is never printed or
 * stored, and the account's sessions are signed out. People who set their own
 * password are untouched (the test sign-in fails for them), and nobody loses
 * access: Google sign-in and "Forgot password" both still work.
 *
 * Dry run by default, which only reports the matching emails:
 *   npx tsx scripts/rotate-demo-passwords.ts
 * Then rotate them:
 *   npx tsx scripts/rotate-demo-passwords.ts --apply
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const APPLY = process.argv.includes("--apply");
const SHARED_PASSWORD = "velvet";
// Supabase rate-limits password sign-ins per IP; stay well under it.
const PAUSE_MS = 1500;

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** A fresh anon client per attempt, so no session carries between accounts. */
function anon() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Every account, read from profiles (same ids and emails as auth.users).
 * Not auth.admin.listUsers: on this project it 500s ("Database error finding
 * users") once a page reaches an account row Supabase can't read.
 */
async function allUsers() {
  const users: { id: string; email: string | null }[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, email")
      .order("created_at")
      .range(from, from + 499);
    if (error) throw error;
    users.push(...(data ?? []));
    if ((data ?? []).length < 500) return users;
  }
}

async function main() {
  const users = (await allUsers()).filter((u) => u.email);
  console.log(`${users.length} accounts to check${APPLY ? "" : " (dry run)"}.`);

  const exposed: string[] = [];
  for (const user of users) {
    const client = anon();
    const { data, error } = await client.auth.signInWithPassword({
      email: user.email!,
      password: SHARED_PASSWORD,
    });
    await sleep(PAUSE_MS);
    if (error) {
      if (error.status === 429) throw new Error("Rate limited; wait a few minutes and run again.");
      // With captcha protection on, every attempt fails this way, which would
      // read as "nobody exposed". Turn it off in Supabase for the run instead.
      if (error.code === "captcha_failed") throw new Error("Supabase captcha is on; turn it off to run this check.");
      continue; // wrong password, unconfirmed, etc.: not exposed
    }
    exposed.push(user.email!);
    const token = data.session?.access_token;
    if (!APPLY) {
      if (token) await admin.auth.admin.signOut(token, "local").catch(() => {});
      continue;
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: randomBytes(32).toString("hex"),
    });
    if (updateError) console.error(`  couldn't rotate ${user.email}: ${updateError.message}`);
    // Ends every session on the account, including anyone already signed in
    // with the shared password (and this script's own test session).
    if (token) await admin.auth.admin.signOut(token, "global").catch(() => {});
  }

  console.log(
    exposed.length === 0
      ? "No account accepts the shared password."
      : `${exposed.length} account(s) accepted the shared password${APPLY ? " and were rotated" : ""}:\n  ${exposed.join("\n  ")}`,
  );
  if (!APPLY && exposed.length > 0) console.log("Run again with --apply to rotate them.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
