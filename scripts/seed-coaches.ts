// One-time: seed the curated coach directory from lib/coaches.ts into the
// coaches table. Idempotent — upserts on slug.
// Run: npx tsx --env-file=.env.local scripts/seed-coaches.ts
import { COACHES } from "../lib/coaches";
import { supabaseAdmin } from "../lib/supabase/server";

(async () => {
  const sb = supabaseAdmin();
  for (const c of COACHES) {
    const row = {
      slug: c.slug,
      full_name: c.name,
      company: c.org,
      short_description: c.bio,
      offering: c.offerings,
      pricing: c.price,
      best_for: c.bestFor,
      photo_url: c.photoUrl,
      booking_url: c.status === "claimed" ? c.contact : null,
      website: c.source ? `https://${c.source.replace(/^https?:\/\//, "")}` : null,
      source: c.source,
      status: c.status === "claimed" ? "approved" : "unclaimed",
    };
    const { error } = await sb.from("coaches").upsert(row, { onConflict: "slug" });
    console.log(c.slug, error?.message ?? "ok");
  }
})();
