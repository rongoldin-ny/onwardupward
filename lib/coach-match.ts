import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { CoachRow } from "./coach-shared";
import type { Profile } from "./db";

/**
 * "Top match" — Claude scores a real signal between what the candidate is
 * looking for and what each coach offers, so the directory can surface a
 * strong-fit badge instead of making people read every card. Deliberately
 * sparing: most coaches should come back false, not a generic overlap.
 */

const CoachMatches = z.object({
  matches: z.array(
    z.object({
      coach_id: z.string(),
      is_top_match: z.boolean(),
      reason: z
        .string()
        .nullable()
        .describe(
          "One short, concrete sentence on why this is a strong fit (e.g. 'works with senior " +
            "leaders looking to transition careers'). Null when is_top_match is false.",
        ),
    }),
  ),
});

export type CoachMatch = { isTopMatch: boolean; reason: string | null };

function candidateSummary(candidate: Profile): string {
  return [
    candidate.role_type && `Role: ${candidate.role_type}`,
    candidate.career_stage && `Career stage: ${candidate.career_stage}`,
    candidate.dream_job && `Looking for: ${candidate.dream_job}`,
    candidate.last_role_text && `Recent role: ${candidate.last_role_text}`,
    candidate.bio && `Bio: ${candidate.bio}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function scoreMatches(
  candidate: Profile,
  coaches: CoachRow[],
): Promise<Record<string, CoachMatch>> {
  if (!process.env.ANTHROPIC_API_KEY || coaches.length === 0) return {};
  const summary = candidateSummary(candidate);
  if (!summary.trim()) return {};

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: zodOutputFormat(CoachMatches) },
      system:
        "You match a candidate on a design/product leadership network to coaches on its bench. " +
        "For each coach, judge whether there's a STRONG, specific signal that this coach fits " +
        "what the candidate is looking for — not just a generic subject-matter overlap. Only " +
        "mark is_top_match true for a genuinely strong, specific fit; most coaches should be " +
        "false. When true, write one short, concrete, plain-language sentence explaining the " +
        "fit — never restate the coach's bio or use marketing language.",
      messages: [
        {
          role: "user",
          content:
            `Candidate:\n${summary}\n\nCoaches:\n${coaches
              .map(
                (c) =>
                  `- id: ${c.id}\n  ${[c.full_name, c.best_for, c.offering, c.short_description]
                    .filter(Boolean)
                    .join(" | ")}`,
              )
              .join("\n")}`,
        },
      ],
    });
    const parsed = response.parsed_output;
    if (!parsed) return {};
    const out: Record<string, CoachMatch> = {};
    for (const m of parsed.matches) out[m.coach_id] = { isTopMatch: m.is_top_match, reason: m.reason };
    return out;
  } catch (err) {
    console.error("coach-match scoreMatches failed:", err);
    return {};
  }
}

/** Cached per candidate for an hour — the bench and a candidate's profile both change slowly. */
export async function getCoachMatches(
  candidate: Profile,
  coaches: CoachRow[],
): Promise<Record<string, CoachMatch>> {
  if (!process.env.ANTHROPIC_API_KEY || coaches.length === 0) return {};
  const cached = unstable_cache(
    () => scoreMatches(candidate, coaches),
    ["coach-matches", candidate.id, coaches.map((c) => c.id).sort().join(",")],
    { revalidate: 3600 },
  );
  return cached();
}
