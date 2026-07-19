import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { supabaseAdmin } from "./supabase/server";
import { getProfileById, type Profile, type WorkHistoryRow } from "./db";

/**
 * AI profile enrichment (PRD §9), backed by Claude. Produces a prose summary
 * plus a JSON signal block, stored together in profiles.ai_bio — the column
 * recruiters' free-text search matches against.
 *
 * When ANTHROPIC_API_KEY is missing or the API call fails, falls back to the
 * original heuristic generator so enrichment never blocks or breaks a save.
 */

const EnrichmentSignals = z.object({
  summary: z
    .string()
    .describe("A 150-200 word professional summary expanding the profile with implicit, searchable signals"),
  industries: z.array(z.string()).describe("Industries this person has likely worked in"),
  product_types: z
    .array(z.string())
    .describe("Relevant product types, e.g. B2B SaaS, consumer apps, fintech, e-commerce"),
  inferred_skills: z.array(z.string()).describe("Likely technical skills or tools based on their experience"),
  leadership_level: z.string().describe("IC vs management track signal, e.g. 'senior IC' or 'management'"),
  searchable_tags: z.array(z.string()).describe("Lowercase tags a recruiter might search for"),
});

type Signals = z.infer<typeof EnrichmentSignals>;

function candidateDataBlock(profile: Profile, work: WorkHistoryRow[]): string {
  return [
    `Name: ${profile.name ?? "unknown"}`,
    `Role type: ${profile.role_type ?? "unknown"}`,
    `Career stage: ${profile.career_stage ?? "unknown"}`,
    `Years of experience: ${profile.years_experience ?? "unknown"}`,
    `Location: ${[profile.location_city, profile.location_state, profile.location_country].filter(Boolean).join(", ") || "unknown"}`,
    `Self-declared industries: ${profile.industries.join(", ") || "none"}`,
    `Work history: ${work.map((w) => `${w.title ?? "?"} at ${w.company ?? "?"}`).join("; ") || "none"}`,
    `Bio: ${profile.bio ?? "none"}`,
    `Recent role: ${profile.last_role_text ?? "none"}`,
    `Dream job: ${profile.dream_job ?? "none"}`,
    `Brags: ${profile.brags.join(" | ") || "none"}`,
  ].join("\n");
}

async function generateAiBioWithClaude(
  profile: Profile,
  work: WorkHistoryRow[],
): Promise<{ aiBio: string; industries: string[] }> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      // Straightforward extraction/summarization — low keeps enrichment fast
      // and cheap; raise if summary quality ever feels thin.
      effort: "low",
      format: zodOutputFormat(EnrichmentSignals),
    },
    system:
      "You are a talent intelligence system for a design-focused hiring platform. " +
      "Given candidate profile data, generate an enriched professional summary that expands " +
      "on the explicit information with implicit, searchable signals: industries they've likely " +
      "worked in (based on employers and role descriptions), relevant product types, inferred " +
      "technical skills or tools, leadership signals (IC vs management track), and key themes " +
      "from their dream job and recent role. Be concrete and grounded in the data provided — " +
      "do not invent employers, titles, or accomplishments.",
    messages: [
      {
        role: "user",
        content: `Candidate data:\n${candidateDataBlock(profile, work)}`,
      },
    ],
  });

  const signals = response.parsed_output;
  if (!signals) throw new Error("enrichment response failed schema validation");
  return {
    aiBio: `${signals.summary}\n\n${JSON.stringify(signalsForStorage(signals), null, 2)}`,
    industries: signals.industries,
  };
}

function signalsForStorage(s: Signals): Omit<Signals, "summary"> {
  const { summary: _omit, ...rest } = s;
  return rest;
}

// ------------------------------------------------------------ heuristic fallback

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

export function generateAiBioHeuristic(profile: Profile, work: WorkHistoryRow[]): string {
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

// ------------------------------------------------------------ orchestration

/** PRD §9.3 — accumulate company knowledge from each enrichment pass. */
export async function updateCompanySignals(work: WorkHistoryRow[], aiIndustries?: string[]) {
  const supabase = supabaseAdmin();
  for (const row of work) {
    if (!row.company) continue;
    const tags = aiIndustries?.length
      ? aiIndustries.map((i) => i.toLowerCase())
      : inferredIndustries([row.company]);
    const { data: existing } = await supabase
      .from("company_signals")
      .select("tags")
      .eq("company_name", row.company)
      .maybeSingle();
    const merged = existing ? [...new Set([...(existing.tags as string[]), ...tags])] : tags;
    await supabase.from("company_signals").upsert({
      company_name: row.company,
      tags: merged,
      last_updated: new Date().toISOString(),
    });
  }
}

/** The actual enrichment pass — callable directly (scripts) or via trigger. */
export async function runEnrichment(profileId: string): Promise<void> {
  const profile = await getProfileById(profileId);
  if (!profile) return;
  const supabase = supabaseAdmin();
  const { data: workRows } = await supabase
    .from("work_history")
    .select("*")
    .eq("candidate_id", profileId)
    .order("sort_order");
  const work = (workRows ?? []) as WorkHistoryRow[];

  let aiBio: string;
  let aiIndustries: string[] | undefined;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await generateAiBioWithClaude(profile, work);
      aiBio = result.aiBio;
      aiIndustries = result.industries;
    } catch (e) {
      console.error("Claude enrichment failed, using heuristic fallback:", e);
      aiBio = generateAiBioHeuristic(profile, work);
    }
  } else {
    aiBio = generateAiBioHeuristic(profile, work);
  }

  await supabase.from("profiles").update({ ai_bio: aiBio }).eq("id", profileId);
  await updateCompanySignals(work, aiIndustries);
}

/**
 * Fire-and-forget enrichment after onboarding completes or a profile saves.
 * Uses Next's after() so the work survives the response on serverless
 * (a bare setTimeout gets frozen when the Vercel function suspends).
 */
export function triggerEnrichment(profileId: string) {
  import("next/server")
    .then(({ after }) => {
      after(async () => {
        try {
          await runEnrichment(profileId);
        } catch (e) {
          console.error("enrichment failed:", e);
        }
      });
    })
    .catch(() => {
      // Outside a request scope (shouldn't happen from actions) — run directly.
      void runEnrichment(profileId).catch((e) => console.error("enrichment failed:", e));
    });
}
