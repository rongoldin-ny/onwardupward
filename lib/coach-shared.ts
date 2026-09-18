/**
 * Client-safe coach types and derived facets — no server imports here so
 * client components (directory, listing form) can use them freely.
 */

import type { Profile } from "./db";
import type { ChecklistItem } from "./profile-required";

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
  /** What they are — see CERTIFICATION_OPTIONS. Several can be true at once. */
  certifications: string[];
  /** What "Other" stands for, when they picked it. */
  certification_other: string | null;
  /** Custom headline overriding the auto-derived "<company> · <discipline>" line when set. */
  title: string | null;
  best_for: string | null;
  photo_url: string | null;
  booking_url: string | null;
  website: string | null;
  substack_url: string | null;
  company: string | null;
  pricing: string | null;
  /** The first conversation costs nothing. */
  free_intro_call: boolean;
  /** The number comes on the call rather than on the listing. */
  pricing_on_call: boolean;
  credentials: string | null;
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

/**
 * Mentor and coach are different practices, and the ICF levels are a ladder
 * within the second — so this is a separate question from discipline (what
 * they coach in) and from levels (who they take). See components/
 * CertificationInfo.tsx for the copy that explains the difference to people.
 */
export const CERTIFICATION_OPTIONS: { value: string; label: string }[] = [
  { value: "mentor", label: "Mentor" },
  { value: "coach", label: "Coach (non-certified)" },
  { value: "icf_acc", label: "ICF Coach: Associate (L1)" },
  { value: "icf_pcc", label: "ICF Coach: Professional (L2)" },
  { value: "icf_mcc", label: "ICF Coach: Master (L3)" },
  { value: "other", label: "Other" },
];

export const CERTIFICATION_VALUES = CERTIFICATION_OPTIONS.map((o) => o.value);

/**
 * One answer to "what kind of coach are you": uncertified, or a rung of the
 * ICF ladder. At most one is true of a person — you don't hold PCC and
 * non-certified at once, and MCC already requires having held PCC.
 */
export const COACH_CREDENTIALS = ["coach", "icf_acc", "icf_pcc", "icf_mcc"];

/**
 * Drops anything unrecognised and keeps one credential. Last one wins: in the
 * picker that's the chip just clicked, so moving between levels — or dropping
 * back to non-certified — replaces the old answer instead of being ignored.
 * Mentor and Other are untouched; they answer a different question.
 */
export function normalizeCertifications(values: string[]): string[] {
  const known = values.filter((v) => CERTIFICATION_VALUES.includes(v));
  const chosen = known.filter((v) => COACH_CREDENTIALS.includes(v)).pop();
  return known.filter((v) => !COACH_CREDENTIALS.includes(v) || v === chosen);
}

export function labelForCertification(value: string): string {
  return CERTIFICATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Display labels, with "Other" replaced by whatever they named it. */
export function certificationLabels(
  c: Pick<CoachRow, "certifications" | "certification_other">,
): string[] {
  return (c.certifications ?? []).map((value) =>
    value === "other" && c.certification_other
      ? c.certification_other
      : labelForCertification(value),
  );
}

/**
 * The disciplines a listing shows, in the picker's own words. "Both" becomes
 * two chips rather than the word: a reader wants to know which disciplines,
 * and "Both" only answers that if you can see the question.
 */
export function disciplineChips(d: CoachDiscipline | null): string[] {
  if (d === "design") return ["Design"];
  if (d === "product") return ["Product"];
  if (d === "both") return ["Design", "Product"];
  return [];
}

/** Prose form, for a subtitle or a sentence — "Design coaching". */
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
  // Only a listing with nobody behind it gets levels read out of its copy.
  // Once someone owns it, the card must say what they ticked and nothing
  // else — a chip they never chose is one they can't remove.
  if (c.profile_id) return [];
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
  // Saying the price is discussed on a call is an answer, not a blank — it
  // lands in "Inquire" either way, but it stops a published number being
  // inferred from stray digits in the prose.
  if (c.pricing_on_call) return "Inquire";
  return /[$£€]\s?\d|\d+\s?(per|\/)\s?session/i.test(c.pricing ?? "")
    ? "Published pricing"
    : "Inquire";
}

/** What the directory's Pricing filter offers. */
export const PRICING_FILTERS = [
  "Published pricing",
  "Inquire",
  "Free introductory call",
] as const;

/**
 * Everything the Pricing filter can match a listing on. A free first call is
 * its own answer rather than a third value of the published/inquire question:
 * a coach can publish a rate and still talk first.
 */
export function coachPricingFacets(c: CoachRow): string[] {
  const out = [coachPricing(c)];
  if (c.free_intro_call) out.push("Free introductory call");
  return out;
}

/** The pricing lines a listing shows, in the order they read best. */
export function pricingNotes(
  c: Pick<CoachRow, "free_intro_call" | "pricing_on_call">,
): string[] {
  const out: string[] = [];
  if (c.free_intro_call) out.push("Free introductory call");
  if (c.pricing_on_call) out.push("Pricing discussed on the call");
  return out;
}

// ------------------------------------------------------- listing visibility

/** What the directory needs to know about a claimed listing's owner. */
export type ListingOwner = Pick<
  Profile,
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

// ------------------------------------------------------- listing requirements

/**
 * What a listing has to say about the practice before it's any use. The first
 * three are what lib/coach-match.ts feeds Claude when it matches members to
 * coaches; the rest are what a member reads before deciding, and the one link
 * they need to actually reach them. Everything else on the card (pricing,
 * credentials, newsletter) is a bonus and isn't nagged.
 */
export function coachChecklist(c: CoachRow): ChecklistItem[] {
  const item = (label: string, done: boolean) => ({ label, done });
  return [
    item("Certification", (c.certifications ?? []).length > 0),
    item("Disciplines", !!c.disciplines),
    item("Who you mentor", c.target_mentees.length > 0),
    item("Specialization", c.specialties.length > 0),
    item("The offering", !!c.offering),
    item("Best for", !!c.best_for),
    item("Booking or contact link", !!c.booking_url),
  ];
}

export function coachMissing(c: CoachRow): string[] {
  return coachChecklist(c)
    .filter((i) => !i.done)
    .map((i) => i.label);
}

export function coachCompletionPct(c: CoachRow): number {
  const items = coachChecklist(c);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}
