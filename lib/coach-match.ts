import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { certificationLabels, disciplineLabel, type CoachRow } from "./coach-shared";
import { getWorkHistory, type Profile, type WorkHistoryRow } from "./db";
import { supabaseAdmin } from "./supabase/server";
import { labelForCareerStage, labelForRoleType, labelForSpecialty } from "./taxonomy";

/**
 * Smart coach matching — Claude reads a member's whole profile against the
 * bench and picks the coaches who genuinely fit, each with a one-line "why".
 * Powers the home page's recommended coaches, the /coaches badges and
 * ordering, and the badge on a coach's own page.
 *
 * Results persist in coach_matches, so a member is scored against each coach
 * once: later visits read the stored rows and only send coaches added since
 * to Claude. Editing the profile re-scores the whole bench once.
 */

// Sonnet matched Opus's picks in a side-by-side on the seed bench at under half
// the cost; Haiku was cheaper still but misgendered coaches and padded matches.
const MODEL = "claude-sonnet-5";
/** How many matches a member is shown at most. */
const MAX_MATCHES = 6;
/** Scores at or above this are a "Top match"; the model omits anything below 65. */
const STRONG_SCORE = 80;
const BATCH_SIZE = 50;
/**
 * Part of every stored row's hash. Bump when the prompt or scoring changes in
 * a way members should see — each member is re-scored once on their next visit.
 */
const MATCH_VERSION = "2";

export type CoachFit = "strong" | "good";
/** A coach picked for this member. `rank` is 0 for the best fit. */
export type CoachMatch = { fit: CoachFit; reason: string; rank: number };

const CoachScores = z.object({
  matches: z
    .array(
      z.object({
        coach: z.string().describe("The coach's ref from the list, e.g. 'c12'."),
        score: z.number().describe("Fit from 65 to 100."),
        reason: z.string(),
      }),
    )
    .describe("Only coaches scoring 65 or higher. Empty when nobody genuinely fits."),
});

const COACH_MATCH_SYSTEM = `You match members of onward/upward — a network for design and product leaders — with coaches from its bench.

Read the member's whole profile and judge how well each listed coach would help them. What the member says they want to grow in is the strongest signal; also weigh their discipline, level and career stage, trajectory, years of experience, and industries against who each coach works with and what they offer.

Score each coach who fits on an absolute 0–100 scale, since scores from different batches of coaches are compared against each other:
- 80–100: a specific fit — the coach works on exactly what this member wants, or is aimed squarely at their level and discipline.
- 65–79: a real but broader fit.
- Below 65: leave the coach out. Generic overlap, like both being in design, is not a fit. Most coaches should be left out.

For each coach you include, write one plain-language sentence of at most 25 words, addressed to the member as "you", that names the specific link between their profile and the coach. Don't restate the coach's bio or use marketing language.

Naming: call a person by their first name only — "Jesse", never "Jesse James Garrett" — even when two coaches share a first name, since each sentence is shown on that coach's own card. Never use a gendered pronoun for them. Call a company or collective by its name ("Design Leadership Guild").

Example: "You're aiming for your first design manager role, and Sam coaches ICs through that exact transition."`;

/** Everything on a member's profile that says where they are and where they want to go. */
function profileSummary(p: Profile, work: WorkHistoryRow[] = []): string {
  const history = work
    .map((w) => [w.title, w.company].filter(Boolean).join(" at "))
    .filter(Boolean);
  return [
    // Their own words on what they want coaching help with — leads because
    // it's the strongest signal.
    p.growth_goal && `Where they hope to grow: ${p.growth_goal}`,
    p.dream_job && `Dream job: ${p.dream_job}`,
    p.role_type && `Discipline: ${labelForRoleType(p.role_type)}`,
    p.career_stage && `Career stage: ${labelForCareerStage(p.career_stage)}`,
    p.last_role_text && `Current/most recent role: ${p.last_role_text}`,
    history.length > 0 && `Work history: ${history.join("; ")}`,
    p.industries?.length > 0 && `Industries: ${p.industries.join(", ")}`,
    p.ai_superpowers?.length > 0 &&
      `AI skills: ${p.ai_superpowers.map((s) => `${s.skill} (${s.xp})`).join(", ")}`,
    p.brags?.filter(Boolean).length > 0 && `Proud of: ${p.brags.filter(Boolean).join("; ")}`,
    p.bio && `Bio: ${p.bio}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function coachSummary(c: CoachRow): string {
  return [
    c.full_name,
    c.title || c.company,
    c.disciplines && `Discipline: ${disciplineLabel(c.disciplines)}`,
    c.specialties.length > 0 && `Specialties: ${c.specialties.map(labelForSpecialty).join(", ")}`,
    certificationLabels(c).length > 0 && `Certified as: ${certificationLabels(c).join(", ")}`,
    c.target_mentees.length > 0 && `Works with: ${c.target_mentees.join(", ")}`,
    c.credentials && `Credentials: ${c.credentials}`,
    c.best_for && `Best for: ${c.best_for}`,
    c.offering && `Offers: ${c.offering}`,
    c.short_description && `About: ${c.short_description}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

type MatchRow = { coach_id: string; score: number | null; reason: string | null };

/** One Claude call over a batch of coaches. Returns a row for every coach in it, matched or not. */
async function scoreBatch(member: string, coaches: CoachRow[]): Promise<MatchRow[]> {
  // Short refs instead of UUIDs keep the prompt and the output small.
  const byRef = new Map(coaches.map((c, i) => [`c${i + 1}`, c.id]));
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: zodOutputFormat(CoachScores) },
    system: COACH_MATCH_SYSTEM,
    messages: [
      {
        role: "user",
        content:
          `Member:\n${member}\n\nCoaches:\n` +
          coaches.map((c, i) => `- ref: c${i + 1}\n  ${coachSummary(c)}`).join("\n"),
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`coach matching returned no result (stop_reason: ${response.stop_reason})`);
  }

  const picked = new Map<string, MatchRow>();
  for (const m of response.parsed_output.matches) {
    const id = byRef.get(m.coach.trim());
    const score = Math.round(Math.min(100, Math.max(0, m.score)));
    if (!id || score < 65 || picked.has(id)) continue;
    picked.set(id, { coach_id: id, score, reason: m.reason.trim() });
  }
  return coaches.map((c) => picked.get(c.id) ?? { coach_id: c.id, score: null, reason: null });
}

/** Score the coaches this member hasn't been scored against yet, and store the results. */
async function scoreAndStore(
  profileId: string,
  profileHash: string,
  member: string,
  coaches: CoachRow[],
): Promise<MatchRow[]> {
  const batches: CoachRow[][] = [];
  for (let i = 0; i < coaches.length; i += BATCH_SIZE) batches.push(coaches.slice(i, i + BATCH_SIZE));
  const rows = (await Promise.all(batches.map((b) => scoreBatch(member, b)))).flat();

  const { error } = await supabaseAdmin()
    .from("coach_matches")
    .upsert(rows.map((r) => ({ ...r, profile_id: profileId, profile_hash: profileHash })));
  if (error) console.error("coach_matches upsert failed:", error.message);
  return rows;
}

// Collapses concurrent requests for the same work (e.g. the dashboard and
// /coaches opened together) into one model call on this instance.
const inFlight = new Map<string, Promise<MatchRow[]>>();

/**
 * The member's best-fit coaches among `coaches`, keyed by coach id. Only
 * matched coaches appear. Never rejects — on any failure it resolves to
 * whatever is already stored, and unscored coaches are retried next visit.
 */
export async function getCoachMatches(
  member: Profile,
  coaches: CoachRow[],
): Promise<Record<string, CoachMatch>> {
  // A member who also coaches shouldn't be matched with their own listing.
  coaches = coaches.filter((c) => c.profile_id !== member.id);
  if (coaches.length === 0) return {};
  try {
    const work = await getWorkHistory(member.id);
    const summary = profileSummary(member, work);
    if (!summary.trim()) return {};
    const profileHash = createHash("sha256").update(MATCH_VERSION).update(summary).digest("hex");

    const { data, error } = await supabaseAdmin()
      .from("coach_matches")
      .select("coach_id, score, reason, profile_hash")
      .eq("profile_id", member.id);
    if (error) throw new Error(`coach_matches read failed: ${error.message}`);

    // Rows scored against an older profile (or MATCH_VERSION) count as unscored.
    const rows: MatchRow[] = ((data ?? []) as (MatchRow & { profile_hash: string })[]).filter(
      (r) => r.profile_hash === profileHash,
    );
    const scored = new Set(rows.map((r) => r.coach_id));
    const unscored = coaches.filter((c) => !scored.has(c.id));

    if (unscored.length > 0 && process.env.ANTHROPIC_API_KEY) {
      const key = `${member.id}:${profileHash}:${unscored.map((c) => c.id).join(",")}`;
      let pending = inFlight.get(key);
      if (!pending) {
        pending = scoreAndStore(member.id, profileHash, summary, unscored).finally(() =>
          inFlight.delete(key),
        );
        inFlight.set(key, pending);
      }
      try {
        rows.push(...(await pending));
      } catch (err) {
        console.error("coach matching failed:", err);
      }
    }

    const onBench = new Set(coaches.map((c) => c.id));
    const out: Record<string, CoachMatch> = {};
    rows
      .filter((r): r is MatchRow & { score: number } => r.score != null && onBench.has(r.coach_id))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MATCHES)
      .forEach((r, rank) => {
        out[r.coach_id] = {
          fit: r.score >= STRONG_SCORE ? "strong" : "good",
          reason: r.reason ?? "",
          rank,
        };
      });
    return out;
  } catch (err) {
    console.error("getCoachMatches failed:", err);
    return {};
  }
}

export type ViewerMatch = { isTopMatch: boolean; reason: string | null };

const ViewerMatches = z.object({
  matches: z.array(
    z.object({
      profile_id: z.string(),
      is_possible_match: z.boolean(),
      reason: z
        .string()
        .nullable()
        .describe(
          "One short, concrete sentence on why this viewer might be worth reaching out to " +
            "(e.g. 'looking to move from IC to management'). Null when is_possible_match is false.",
        ),
    }),
  ),
});

/** Throws on failure so the cache never stores an empty result from an outage. */
async function scoreViewers(
  coach: CoachRow,
  viewers: Profile[],
): Promise<Record<string, ViewerMatch>> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: zodOutputFormat(ViewerMatches) },
    system:
      "You help a coach on a design/product leadership network understand which members who " +
      "viewed their listing might be worth reaching out to. For each viewer, judge whether " +
      "there's a STRONG, specific signal they fit what this coach offers — not just a generic " +
      "overlap. Only mark is_possible_match true for a genuinely strong, specific fit; most " +
      "viewers should be false. When true, write one short, concrete, plain-language sentence " +
      "— never restate the viewer's bio or use marketing language.",
    messages: [
      {
        role: "user",
        content:
          `Coach:\n${coachSummary(coach)}\n\nViewers:\n${viewers
            .map((v) => `- id: ${v.id}\n  ${profileSummary(v).replace(/\n/g, "\n  ")}`)
            .join("\n")}`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`viewer matching returned no result (stop_reason: ${response.stop_reason})`);
  }
  const out: Record<string, ViewerMatch> = {};
  for (const m of response.parsed_output.matches)
    out[m.profile_id] = { isTopMatch: m.is_possible_match, reason: m.reason };
  return out;
}

/** For a coach's analytics: which viewers might be worth reaching out to, and why. Cached per (coach, viewer set) for an hour. */
export async function getViewerMatches(
  coach: CoachRow,
  viewers: Profile[],
): Promise<Record<string, ViewerMatch>> {
  if (!process.env.ANTHROPIC_API_KEY || viewers.length === 0) return {};
  try {
    return await unstable_cache(
      () => scoreViewers(coach, viewers),
      ["viewer-matches", coach.id, viewers.map((v) => v.id).sort().join(",")],
      { revalidate: 3600 },
    )();
  } catch (err) {
    console.error("getViewerMatches failed:", err);
    return {};
  }
}
