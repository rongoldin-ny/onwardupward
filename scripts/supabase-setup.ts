/**
 * Post-migration setup that can't run in the SQL editor: creates the
 * 'profile-assets' storage bucket via the Storage API (Supabase blocks direct
 * SQL against storage tables). Idempotent — safe to run repeatedly.
 *
 * Run: npx tsx scripts/supabase-setup.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const BUCKET = "profile-assets";

async function main() {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;

  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" already exists — nothing to do.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (error) throw error;
  console.log(`Created public bucket "${BUCKET}".`);
}

main().catch((e) => {
  console.error("Setup failed:", e.message ?? e);
  process.exit(1);
});
