// Repair for listings emptied by the old syncCoachIdentity, which wrote a
// claimant's profile straight over the curated row and nulled the photo,
// description and website researched by hand. Refills ONLY the columns that
// are blank right now, from the seed in lib/coaches.ts — anything the coach
// has written since is left exactly as it is, and status, slug and profile_id
// are never touched, so this can't un-claim anybody.
//
// Run:  npx tsx --env-file=.env.local scripts/restore-coach-fields.ts frank-harris
//       npx tsx --env-file=.env.local scripts/restore-coach-fields.ts --dry-run frank-harris
// With no slugs it checks every curated coach.
import { COACHES } from "../lib/coaches";
import { supabaseAdmin } from "../lib/supabase/server";

/** What the seeder would write for this coach, minus the fields a claim owns. */
function seedValues(c: (typeof COACHES)[number]) {
  return {
    full_name: c.name,
    title: c.title ?? null,
    company: c.org,
    short_description: c.bio,
    offering: c.offerings,
    pricing: c.price,
    best_for: c.bestFor,
    photo_url: c.photoUrl,
    website: c.source ? `https://${c.source.replace(/^https?:\/\//, "")}` : null,
    substack_url: c.substackUrl ?? null,
    source: c.source,
    specialties: c.specialties ?? [],
  };
}

const isBlank = (v: unknown) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

(async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const slugs = args.filter((a) => !a.startsWith("--"));
  const targets = slugs.length > 0 ? COACHES.filter((c) => slugs.includes(c.slug)) : COACHES;

  const missing = slugs.filter((s) => !COACHES.some((c) => c.slug === s));
  if (missing.length > 0) {
    console.error(`No seed entry for: ${missing.join(", ")}`);
    process.exit(1);
  }

  const sb = supabaseAdmin();
  for (const coach of targets) {
    const { data, error } = await sb
      .from("coaches")
      .select("*")
      .eq("slug", coach.slug)
      .maybeSingle();
    if (error) {
      console.log(`${coach.slug}: ${error.message}`);
      continue;
    }
    if (!data) {
      console.log(`${coach.slug}: no row`);
      continue;
    }

    const row = data as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(seedValues(coach))) {
      if (isBlank(row[key]) && !isBlank(value)) patch[key] = value;
    }

    const fields = Object.keys(patch);
    if (fields.length === 0) {
      console.log(`${coach.slug}: nothing blank`);
      continue;
    }
    if (dryRun) {
      console.log(`${coach.slug}: would refill ${fields.join(", ")}`);
      continue;
    }
    const { error: writeError } = await sb.from("coaches").update(patch).eq("slug", coach.slug);
    console.log(`${coach.slug}: ${writeError?.message ?? `refilled ${fields.join(", ")}`}`);
  }
})();
