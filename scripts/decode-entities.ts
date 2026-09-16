// One-off cleanup: decode HTML character references (e.g. "I&#x27;m") that were
// saved into member / coach text before lib/html-entities.ts existed.
//   Dry run:  npx tsx --env-file=.env.local scripts/decode-entities.ts
//   Apply:    npx tsx --env-file=.env.local scripts/decode-entities.ts --apply
import { decodeHtmlEntities } from "../lib/html-entities";
import { supabaseAdmin } from "../lib/supabase/server";

const TABLES: { table: string; text: string[]; arrays?: string[]; label: string }[] = [
  {
    table: "profiles",
    label: "name",
    text: ["name", "bio", "last_role_text", "dream_job", "growth_goal", "location_city", "location_state"],
    arrays: ["brags"],
  },
  { table: "work_history", label: "company", text: ["title", "company"] },
  { table: "refs", label: "full_name", text: ["full_name", "current_title"] },
  {
    table: "coaches",
    label: "full_name",
    text: ["full_name", "short_description", "offering", "title", "best_for", "company", "pricing", "credentials"],
  },
];

const apply = process.argv.includes("--apply");
const sb = supabaseAdmin();

(async () => {
  let total = 0;
  for (const { table, text, arrays = [], label } of TABLES) {
    const { data, error } = await sb.from(table).select(["id", ...new Set([label, ...text, ...arrays])].join(", "));
    if (error) throw new Error(`${table}: ${error.message}`);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const patch: Record<string, unknown> = {};
      for (const col of text) {
        const v = row[col];
        if (typeof v === "string" && decodeHtmlEntities(v) !== v) patch[col] = decodeHtmlEntities(v);
      }
      for (const col of arrays) {
        const v = row[col];
        if (Array.isArray(v) && v.some((x) => typeof x === "string" && decodeHtmlEntities(x) !== x)) {
          patch[col] = v.map((x) => (typeof x === "string" ? decodeHtmlEntities(x) : x));
        }
      }
      if (Object.keys(patch).length === 0) continue;
      total++;
      console.log(`${table} ${row.id} (${row[label] ?? "—"}): ${Object.keys(patch).join(", ")}`);
      for (const [col, next] of Object.entries(patch)) {
        const before = JSON.stringify(row[col]).slice(0, 120);
        const after = JSON.stringify(next).slice(0, 120);
        console.log(`   ${col}: ${before}\n   ${" ".repeat(col.length)}→ ${after}`);
      }
      if (apply) {
        const { error: upErr } = await sb.from(table).update(patch).eq("id", row.id as string);
        if (upErr) console.error(`   ! update failed: ${upErr.message}`);
      }
    }
  }
  console.log(`\n${total} row(s) ${apply ? "updated" : "would change — re-run with --apply"}`);
})();
