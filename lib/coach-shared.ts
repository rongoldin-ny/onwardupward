/**
 * Client-safe coach types and derived facets — no server imports here so
 * client components (directory, listing form) can use them freely.
 */

import type { ChecklistItem, RequiredFields } from "./profile-required";

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

/** A coach's newsletter plus the facets their posts are attributed and tagged with. */
export type CoachFeed = {
  substack_url: string;
  full_name: string;
  disciplines: CoachDiscipline | null;
  specialties: string[];
};

/**
 * What a coach can be filtered by. The first four are the discipline they
 * coach in; the last two are a practice, and sit on this axis rather than
 * leaning on the "Directors & execs" level — coaching an exec through their
 * first quarter isn't the same claim as being willing to take exec clients.
 */
export const DISCIPLINE_FILTERS = [
  "Design",
  "Product",
  "Content Design",
  "Research",
  "Executive",
  "Startup founder",
] as const;

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
  if (specialties.includes("executive_coaching")) out.push("Executive");
  if (specialties.includes("founder_coaching")) out.push("Startup founder");
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

// ------------------------------------------------------- listing visibility

/** What the directory needs to know about a claimed listing's owner. */
export type ListingOwner = Pick<
  RequiredFields,
  "name" | "email" | "linkedin_url" | "portfolio_url" | "website_url" | "resume_url"
> & { archived_at: string | null };

/**
 * Whether a listing shows in the directory and on its own page.
 *
 * A claimed listing stands on its own fields *and* its owner's profile, so
 * accepting a claim can never hide a card that was already public: the curated
 * row it came from already carries a name, an email and a link. An archived
 * owner still takes their listing down with them.
 */
export function coachListingVisible(
  c: Pick<CoachRow, "profile_id" | "full_name" | "email" | "booking_url" | "website" | "substack_url">,
  owner: ListingOwner | null | undefined,
): boolean {
  if (!c.profile_id) return true;
  if (!owner || owner.archived_at) return false;
  const link =
    c.booking_url ||
    c.website ||
    c.substack_url ||
    owner.linkedin_url ||
    owner.portfolio_url ||
    owner.website_url ||
    owner.resume_url;
  return !!((c.full_name || owner.name) && (c.email || owner.email) && link);
}

// --------------------------------------------------------- practice nagging

/**
 * What a coach still has to say about their practice. None of it gates the
 * listing — it's what lib/coach-match.ts feeds Claude when it matches members
 * to coaches, so a thin listing is a listing that rarely gets matched.
 */
export function coachChecklist(c: CoachRow): ChecklistItem[] {
  const item = (label: string, done: boolean) => ({ label, done, required: false });
  return [
    item("Photo", !!c.photo_url),
    item("About you", !!c.short_description),
    item("Discipline", !!c.disciplines),
    item("Specialties", c.specialties.length > 0),
    item("Who you work with", c.target_mentees.length > 0),
    item("The offering", !!c.offering),
    item("Best for", !!c.best_for),
    item("Years coaching", c.years_coaching !== null && c.years_coaching !== undefined),
    item("Credentials", !!c.credentials),
    item("Pricing", !!c.pricing),
    item("Booking link", !!c.booking_url),
    item("Newsletter", !!c.substack_url),
  ];
}

export function coachCompletionPct(c: CoachRow): number {
  const items = coachChecklist(c);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}
