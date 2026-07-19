/**
 * One-time migration: ports everything from the local SQLite database
 * (.data/ou.db) into the live Supabase project — auth users, profiles, work
 * history, references, messages, analytics events, company signals, and
 * uploaded images (moved into Storage with URLs rewritten).
 *
 * - Demo accounts get password "velvet" (as before).
 * - r@rongoldin.com gets a random password + a reset email so Ron sets his own.
 *
 * Run: npx tsx scripts/migrate-sqlite.ts
 */
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { readFileSync, existsSync } from "fs";
import path from "path";

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const sqlite = new Database(".data/ou.db", { readonly: true });
const RON_EMAIL = "r@rongoldin.com";
const DEMO_PASSWORD = "velvet";

type OldProfile = Record<string, any>;

async function uploadLocalFile(localUrl: string, ownerId: string): Promise<string | null> {
  const name = localUrl.split("/").pop()!;
  const file = path.join(".data/uploads", name);
  if (!existsSync(file)) return null;
  const ext = name.split(".").pop()!;
  const contentType =
    { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }[ext] ??
    "application/octet-stream";
  const dest = `${ownerId}/${name}`;
  const { error } = await admin.storage
    .from("profile-assets")
    .upload(dest, readFileSync(file), { contentType, upsert: true });
  if (error) {
    console.warn(`  ! upload failed for ${name}: ${error.message}`);
    return null;
  }
  return admin.storage.from("profile-assets").getPublicUrl(dest).data.publicUrl;
}

async function main() {
  const profiles = sqlite.prepare("select * from profiles").all() as OldProfile[];
  const idMap = new Map<string, string>(); // old id -> new auth id

  console.log(`Migrating ${profiles.length} accounts…`);

  for (const p of profiles) {
    if (!p.email) {
      console.warn(`  skipping profile ${p.id} with no email`);
      continue;
    }
    const isRon = p.email === RON_EMAIL;
    const password = isRon ? randomBytes(24).toString("hex") : DEMO_PASSWORD;

    const { data: created, error } = await admin.auth.admin.createUser({
      email: p.email,
      password,
      email_confirm: true,
      user_metadata: { role: p.role },
    });
    if (error) {
      console.error(`  ! createUser failed for ${p.email}: ${error.message}`);
      continue;
    }
    const newId = created.user.id;
    idMap.set(p.id, newId);

    // Move uploaded files into Storage, rewriting URLs.
    let photoUrl = p.photo_url as string | null;
    if (photoUrl?.startsWith("/uploads/")) {
      photoUrl = (await uploadLocalFile(photoUrl, newId)) ?? null;
    }
    const images: { url: string; company: string; caption: string; year: string }[] = [];
    for (const img of JSON.parse(p.portfolio_images || "[]")) {
      let url = img.url as string;
      if (url.startsWith("/uploads/")) {
        const moved = await uploadLocalFile(url, newId);
        if (!moved) continue;
        url = moved;
      }
      images.push({ ...img, url });
    }

    // The signup trigger already created a bare profile row — fill it in.
    const { error: upErr } = await admin
      .from("profiles")
      .update({
        role: p.role,
        name: p.name,
        photo_url: photoUrl,
        linkedin_url: p.linkedin_url,
        location_country: p.location_country,
        location_state: p.location_state,
        location_city: p.location_city,
        role_type: p.role_type,
        career_stage: p.career_stage,
        bio: p.bio,
        ai_bio: p.ai_bio,
        dream_job: p.dream_job,
        last_role_text: p.last_role_text,
        brags: JSON.parse(p.brags || "[]"),
        portfolio_url: p.portfolio_url,
        portfolio_password: p.portfolio_password,
        portfolio_images: images,
        years_experience: p.years_experience,
        industries: JSON.parse(p.industries || "[]"),
        contact_preference: p.contact_preference,
        is_paid: !!p.is_paid,
        onboarding_complete: !!p.onboarding_complete,
        created_at: p.created_at,
      })
      .eq("id", newId);
    if (upErr) console.error(`  ! profile update failed for ${p.email}: ${upErr.message}`);
    else console.log(`  ✓ ${p.email} (${p.role})${isRon ? " — reset email pending" : ""}`);
  }

  const remap = (oldId: string | null) => (oldId ? (idMap.get(oldId) ?? null) : null);

  // Re-runs: if no accounts were actually created (all already existed),
  // porting child data again would only produce orphaned duplicates.
  if (idMap.size === 0) {
    console.log("No new accounts created — skipping data port.");
    if (process.argv.includes("--send-reset")) {
      const { error: resetErr } = await anon.auth.resetPasswordForEmail(RON_EMAIL, {
        redirectTo: "http://localhost:3999/auth/confirm?next=/reset-password",
      });
      console.log(
        resetErr
          ? `! reset email for ${RON_EMAIL} failed: ${resetErr.message}`
          : `✓ password reset email sent to ${RON_EMAIL}`,
      );
    }
    return;
  }

  // Work history + references
  for (const [table, target] of [
    ["work_history", "work_history"],
    ["refs", "refs"],
  ] as const) {
    const rows = sqlite.prepare(`select * from ${table}`).all() as OldProfile[];
    const mapped = rows
      .filter((r) => remap(r.candidate_id))
      .map(({ id: _drop, candidate_id, ...rest }) => ({
        ...rest,
        candidate_id: remap(candidate_id),
      }));
    if (mapped.length) {
      const { error } = await admin.from(target).insert(mapped);
      console.log(
        error ? `  ! ${table}: ${error.message}` : `  ✓ ${table}: ${mapped.length} rows`,
      );
    }
  }

  // Messages
  {
    const rows = sqlite.prepare("select * from messages").all() as OldProfile[];
    const mapped = rows
      .filter((r) => remap(r.recipient_id))
      .map(({ id: _drop, sender_id, recipient_id, read, ...rest }) => ({
        ...rest,
        sender_id: remap(sender_id),
        recipient_id: remap(recipient_id),
        read: !!read,
      }));
    if (mapped.length) {
      const { error } = await admin.from("messages").insert(mapped);
      console.log(error ? `  ! messages: ${error.message}` : `  ✓ messages: ${mapped.length} rows`);
    }
  }

  // Analytics events (batched — there are hundreds)
  {
    const rows = sqlite.prepare("select * from analytics_events").all() as OldProfile[];
    const mapped = rows.map(({ id: _drop, user_id, target_profile_id, metadata, ...rest }) => ({
      ...rest,
      user_id: remap(user_id),
      target_profile_id: remap(target_profile_id),
      metadata: JSON.parse(metadata || "{}"),
    }));
    for (let i = 0; i < mapped.length; i += 200) {
      const batch = mapped.slice(i, i + 200);
      const { error } = await admin.from("analytics_events").insert(batch);
      if (error) {
        console.log(`  ! analytics batch ${i}: ${error.message}`);
        break;
      }
    }
    console.log(`  ✓ analytics_events: ${mapped.length} rows`);
  }

  // Recruiter profiles + company signals
  {
    const rows = sqlite.prepare("select * from recruiter_profiles").all() as OldProfile[];
    const mapped = rows
      .filter((r) => remap(r.id))
      .map((r) => ({
        id: remap(r.id),
        company_names: JSON.parse(r.company_names || "[]"),
        target_role_types: JSON.parse(r.target_role_types || "[]"),
        target_career_stages: JSON.parse(r.target_career_stages || "[]"),
      }));
    if (mapped.length) {
      const { error } = await admin.from("recruiter_profiles").insert(mapped);
      console.log(error ? `  ! recruiter_profiles: ${error.message}` : `  ✓ recruiter_profiles: ${mapped.length} rows`);
    }

    const signals = sqlite.prepare("select * from company_signals").all() as OldProfile[];
    if (signals.length) {
      const { error } = await admin.from("company_signals").insert(
        signals.map((s) => ({
          company_name: s.company_name,
          tags: JSON.parse(s.tags || "[]"),
          last_updated: s.last_updated,
        })),
      );
      console.log(error ? `  ! company_signals: ${error.message}` : `  ✓ company_signals: ${signals.length} rows`);
    }
  }

  // Ron sets his own password via reset email — only when explicitly asked,
  // so the (rate-limited) email isn't sent before Site URL is configured.
  if (process.argv.includes("--send-reset")) {
    const { error: resetErr } = await anon.auth.resetPasswordForEmail(RON_EMAIL, {
      redirectTo: "http://localhost:3999/auth/confirm?next=/reset-password",
    });
    console.log(
      resetErr
        ? `! reset email for ${RON_EMAIL} failed: ${resetErr.message}`
        : `✓ password reset email sent to ${RON_EMAIL}`,
    );
  } else {
    console.log(`(skipped reset email for ${RON_EMAIL} — run with --send-reset once Site URL is set)`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
