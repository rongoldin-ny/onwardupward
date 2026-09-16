/**
 * Client-safe coach types and derived facets — no server imports here so
 * client components (directory, listing form) can use them freely.
 */

export type CoachDiscipline = "design" | "product" | "both";

export type CoachRow = {
  id: string;
  profile_id: string | null;
  slug: string | null;
  full_name: string;
  email: string | null;
  short_description: string | null;
  offering: string | null;
  target_mentees: string[];
  disciplines: CoachDiscipline | null;
  /** Which of the platform's role types (lib/taxonomy.ts ROLE_TYPES) this coach specializes in. */
  specialties: string[];
  /** Custom headline overriding the auto-derived "<company> · <discipline>" line when set. */
  title: string | null;
  best_for: string | null;
  photo_url: string | null;
  booking_url: string | null;
  website: string | null;
  substack_url: string | null;
  company: string | null;
  pricing: string | null;
  credentials: string | null;
  years_coaching: number | null;
  source: string | null;
  status: "draft" | "unclaimed" | "pending" | "approved";
  created_at: string;
  updated_at: string;
};

/**
 * A coach row safe to hand to the browser: the listing's contact email is only
 * used server-side (request emails, claims), never rendered.
 */
export function publicCoach(coach: CoachRow): CoachRow {
  return { ...coach, email: null };
}

export const TARGET_MENTEE_OPTIONS = [
  "Early career",
  "Senior ICs",
  "Managers & leads",
  "Directors & execs",
] as const;

export const DISCIPLINE_OPTIONS: { value: CoachDiscipline; label: string }[] = [
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "both", label: "Both" },
];

export function disciplineLabel(d: CoachDiscipline | null): string {
  if (d === "design") return "Design coaching";
  if (d === "product") return "Product coaching";
  if (d === "both") return "Design & Product";
  return "";
}

/** A coach's newsletter plus the facets /reads attributes and filters posts by. */
export type CoachFeed = {
  substack_url: string;
  full_name: string;
  disciplines: CoachDiscipline | null;
  specialties: string[];
};

/** The discipline facets a reader can filter by, matching the coaches directory. */
export const DISCIPLINE_FILTERS = ["Design", "Product", "Content Design", "Research"] as const;

/** A member's own role, expressed in the same vocabulary as coach facets. */
const ROLE_TYPE_DISCIPLINE: Record<string, string> = {
  product_design: "Design",
  content_design: "Content Design",
  user_research: "Research",
  product_management: "Product",
};

export function disciplineForRoleType(roleType: string | null): string | null {
  return roleType ? (ROLE_TYPE_DISCIPLINE[roleType] ?? null) : null;
}

/**
 * Which discipline filters a coach answers to. "both" (and no answer yet, for
 * curated seeds) covers Design and Product; the finer-grained specialty tags
 * add themselves on top.
 */
export function coachDisciplineLabels(c: {
  disciplines: CoachDiscipline | null;
  specialties: string[] | null;
}): string[] {
  const out: string[] = [];
  if (c.disciplines === "design") out.push("Design");
  else if (c.disciplines === "product") out.push("Product");
  else out.push("Design", "Product");
  const specialties = c.specialties ?? [];
  if (specialties.includes("content_design")) out.push("Content Design");
  if (specialties.includes("user_research")) out.push("Research");
  return out;
}

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
