/**
 * Client-safe coach types and derived facets — no server imports here so
 * client components (directory, listing form) can use them freely.
 */

export type CoachRow = {
  id: string;
  profile_id: string | null;
  slug: string | null;
  full_name: string;
  email: string | null;
  short_description: string | null;
  offering: string | null;
  target_mentees: string[];
  best_for: string | null;
  photo_url: string | null;
  booking_url: string | null;
  website: string | null;
  company: string | null;
  pricing: string | null;
  source: string | null;
  status: "unclaimed" | "pending" | "approved";
  created_at: string;
  updated_at: string;
};

export const TARGET_MENTEE_OPTIONS = [
  "Early career",
  "Senior ICs",
  "Managers & leads",
  "Directors & execs",
] as const;

// ---------------------------------------------------------------- facets

/** Explicit target mentees when set; derived from copy for curated seeds. */
export function coachLevels(c: CoachRow): string[] {
  if (c.target_mentees.length > 0) return c.target_mentees;
  const text = `${c.best_for ?? ""} ${c.offering ?? ""} ${c.short_description ?? ""}`;
  const out: string[] = [];
  if (/cxo|vp\b|executive|director|cdo/i.test(text)) out.push("Directors & execs");
  if (/manager|management|people-leader|leads\b|head of/i.test(text)) out.push("Managers & leads");
  if (/\bic\b|ics\b|senior designer|craft/i.test(text)) out.push("Senior ICs");
  if (/early|junior|career chang|grads|students|first role|aspiring/i.test(text))
    out.push("Early career");
  return out;
}

export function coachFormats(c: CoachRow): string[] {
  const text = `${c.offering ?? ""} ${c.pricing ?? ""}`;
  const out: string[] = [];
  if (/1:1|one-on-one|sessions/i.test(text)) out.push("1:1 coaching");
  if (/cohort|group|mastermind|peer/i.test(text)) out.push("Groups & cohorts");
  if (/masterclass|course|program|workshop|training|curriculum|retreat/i.test(text))
    out.push("Programs & courses");
  return out;
}

export function coachPricing(c: CoachRow): string {
  return /[$£€]\s?\d|\d+\s?(per|\/)\s?session/i.test(c.pricing ?? "")
    ? "Published pricing"
    : "Inquire";
}
