import { supabaseAdmin } from "./supabase/server";
import { getProfileById, type Profile, type WorkHistoryRow } from "./db";

/**
 * Stubbed Gemini enrichment (PRD §9). Produces the same shape the real call
 * would: a 150–200 word prose paragraph followed by a JSON signal block.
 * Swap `generateAiBio` for a real Gemini/Claude call without touching callers.
 */

const INDUSTRY_MAP: Record<string, string[]> = {
  stripe: ["fintech", "payments"],
  monzo: ["fintech", "consumer banking"],
  wise: ["fintech", "payments"],
  xero: ["b2b saas", "accounting"],
  canva: ["consumer creative tools", "b2b saas"],
  loom: ["b2b saas", "collaboration tools"],
  atlassian: ["b2b saas", "developer tools"],
};

function inferredIndustries(companies: string[]): string[] {
  const out = new Set<string>();
  for (const c of companies) {
    for (const tag of INDUSTRY_MAP[c.toLowerCase().trim()] ?? []) out.add(tag);
  }
  if (out.size === 0) out.add("software");
  return [...out];
}

export function generateAiBio(profile: Profile, work: WorkHistoryRow[]): string {
  const companies = work.map((w) => w.company).filter(Boolean) as string[];
  const industries = inferredIndustries(companies);
  const brags = profile.brags;
  const isManager =
    /manager|director|lead|head/i.test(profile.role_type ?? "") ||
    /manager|director|lead|head/i.test(work[0]?.title ?? "");

  const declared = profile.industries;
  const signals = {
    industries: [...new Set([...industries, ...declared.map((i) => i.toLowerCase())])],
    product_types: industries.includes("fintech")
      ? ["fintech", "consumer apps", "b2b saas"]
      : ["b2b saas", "consumer apps"],
    inferred_skills: [
      "design systems",
      "interaction design",
      "prototyping",
      ...(brags.some((b) => /research/i.test(b)) ? ["user research"] : []),
      ...(brags.some((b) => /conversion|growth|%/i.test(b)) ? ["growth design"] : []),
    ],
    leadership_level: isManager ? "management" : "senior IC",
    searchable_tags: [
      ...industries,
      ...companies.map((c) => c.toLowerCase()),
      profile.career_stage ?? "",
      profile.location_city?.toLowerCase() ?? "",
    ].filter(Boolean),
  };

  const companyList = companies.length ? companies.join(", ") : "leading product companies";
  const prose =
    `${profile.name ?? "This candidate"} is a ${profile.career_stage ?? "senior"} ` +
    `${(profile.role_type ?? "product designer").replace(/_/g, " ")} based in ` +
    `${profile.location_city ?? "an unknown city"}, with experience spanning ${companyList}. ` +
    `Their track record points to ${industries.join(" and ")} work, with strengths in ` +
    `${signals.inferred_skills.slice(0, 3).join(", ")}. ` +
    (profile.dream_job
      ? `They are drawn to ${profile.dream_job.toLowerCase().replace(/\.$/, "")}. `
      : "") +
    (brags.length ? `Highlights include: ${brags.slice(0, 3).join(" ")} ` : "") +
    `Signals suggest a ${signals.leadership_level} trajectory.`;

  return `${prose}\n\n${JSON.stringify(signals, null, 2)}`;
}

/** PRD §9.3 — accumulate company knowledge from each enrichment pass. */
export async function updateCompanySignals(work: WorkHistoryRow[]) {
  const supabase = supabaseAdmin();
  for (const row of work) {
    if (!row.company) continue;
    const tags = inferredIndustries([row.company]);
    const { data: existing } = await supabase
      .from("company_signals")
      .select("tags")
      .eq("company_name", row.company)
      .maybeSingle();
    const merged = existing
      ? [...new Set([...(existing.tags as string[]), ...tags])]
      : tags;
    await supabase.from("company_signals").upsert({
      company_name: row.company,
      tags: merged,
      last_updated: new Date().toISOString(),
    });
  }
}

/** Fire-and-forget enrichment, called after onboarding completes or profile saves. */
export function triggerEnrichment(profileId: string) {
  setTimeout(async () => {
    try {
      const profile = await getProfileById(profileId);
      if (!profile) return;
      const supabase = supabaseAdmin();
      const { data: work } = await supabase
        .from("work_history")
        .select("*")
        .eq("candidate_id", profileId)
        .order("sort_order");
      const rows = (work ?? []) as WorkHistoryRow[];
      await supabase
        .from("profiles")
        .update({ ai_bio: generateAiBio(profile, rows) })
        .eq("id", profileId);
      await updateCompanySignals(rows);
    } catch (e) {
      console.error("enrichment failed:", e);
    }
  }, 50);
}
