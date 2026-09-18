// Seed or refresh curated coach listings from lib/coaches.ts. Idempotent —
// upserts on slug — and prints each listing's claim link to send on.
//
// Run: npx tsx --env-file=.env.local scripts/seed-coaches.ts
//      npx tsx --env-file=.env.local scripts/seed-coaches.ts jennifer-bove
//
// Pass slugs to touch only those rows. Claimed listings are always skipped:
// their owner edits them now, and a blanket re-seed would hand them back a row
// marked "unclaimed" with their own edits overwritten.
import { COACHES } from "../lib/coaches";
import { supabaseAdmin } from "../lib/supabase/server";

const SITE = "https://onwardupward.io";

(async () => {
  const slugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const targets = slugs.length > 0 ? COACHES.filter((c) => slugs.includes(c.slug)) : COACHES;

  const missing = slugs.filter((s) => !COACHES.some((c) => c.slug === s));
  if (missing.length > 0) {
    console.error(`No seed entry for: ${missing.join(", ")}`);
    process.exit(1);
  }

  const sb = supabaseAdmin();
  for (const c of targets) {
    const { data: existing } = await sb
      .from("coaches")
      .select("id, profile_id, status")
      .eq("slug", c.slug)
      .maybeSingle();
    if (existing?.profile_id) {
      console.log(`${c.slug}: claimed — skipped`);
      continue;
    }

    const row = {
      slug: c.slug,
      full_name: c.name,
      title: c.title ?? null,
      company: c.org,
      short_description: c.bio,
      offering: c.offerings,
      pricing: c.price,
      best_for: c.bestFor,
      photo_url: c.photoUrl,
      booking_url: c.status === "claimed" ? c.contact : null,
      website: c.source ? `https://${c.source.replace(/^https?:\/\//, "")}` : null,
      substack_url: c.substackUrl ?? null,
      source: c.source,
      status: c.status === "claimed" ? "approved" : "unclaimed",
      specialties: c.specialties ?? [],
    };
    const { data, error } = await sb
      .from("coaches")
      .upsert(row, { onConflict: "slug" })
      .select("id")
      .single();
    if (error || !data) {
      console.log(`${c.slug}: ${error?.message ?? "no row returned"}`);
      continue;
    }
    console.log(`${c.slug}: ok — claim link ${SITE}/claim/${data.id}`);
  }
})();
