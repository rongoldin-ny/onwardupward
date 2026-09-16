// Run the post-sign-up Claude auto fill for an existing member (empty fields only):
//   npx tsx --env-file=.env.local scripts/auto-fill.ts someone@example.com
import { autoFillProfile } from "../lib/auto-fill";
import { runEnrichment } from "../lib/enrich";
import { supabaseAdmin } from "../lib/supabase/server";

const email = process.argv[2];
if (!email) {
  console.error("usage: auto-fill.ts <email>");
  process.exit(1);
}
(async () => {
  const { data } = await supabaseAdmin().from("profiles").select("id").eq("email", email).single();
  if (!data) {
    console.error("no profile for", email);
    process.exit(1);
  }
  const filled = await autoFillProfile(data.id);
  console.log(filled.length ? `filled: ${filled.join(", ")}` : "nothing filled (no links, already run, or nothing new)");
  await runEnrichment(data.id);
  console.log("enrichment refreshed");
})();
