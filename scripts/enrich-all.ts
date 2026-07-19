/**
 * Re-run AI enrichment for every candidate profile (e.g. after upgrading the
 * enrichment model or backfilling from the heuristic stub).
 *
 * Run: npx tsx scripts/enrich-all.ts
 * Requires ANTHROPIC_API_KEY in .env.local (falls back to heuristic without it).
 */
import { readFileSync } from "fs";

// Load .env.local into process.env before importing app code that reads it.
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

async function main() {
  const { supabaseAdmin } = await import("../lib/supabase/server");
  const { runEnrichment } = await import("../lib/enrich");

  const { data: candidates, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, name, email")
    .eq("role", "candidate");
  if (error) throw error;

  console.log(
    `Enriching ${candidates!.length} candidates via ${process.env.ANTHROPIC_API_KEY ? "Claude" : "heuristic fallback (no ANTHROPIC_API_KEY)"}…`,
  );
  for (const c of candidates!) {
    const started = Date.now();
    try {
      await runEnrichment(c.id);
      console.log(`  ✓ ${c.name ?? c.email} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.error(`  ✗ ${c.name ?? c.email}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
