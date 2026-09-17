import type { Profile } from "./db";

/** Client-safe: the fields every profile must fill before it's visible. */

export type RequiredLabel =
  | "name"
  | "email"
  | "photo"
  | "role"
  | "level"
  | "where you hope to grow"
  | "background"
  | "a link";

export type RequiredFields = Pick<
  Profile,
  | "name"
  | "email"
  | "photo_url"
  | "role_type"
  | "career_stage"
  | "growth_goal"
  | "linkedin_url"
  | "portfolio_url"
  | "website_url"
  | "resume_url"
  | "bio"
>;

export function hasAnyLink(p: RequiredFields): boolean {
  return !!(p.linkedin_url || p.portfolio_url || p.website_url || p.resume_url);
}

export type ChecklistItem = { label: string; done: boolean };

/**
 * The two bars, and why they differ.
 *
 * A member's profile exists to be matched, so it's held to what matching
 * reads: what they do, at what level, and where they hope to grow. A coach's
 * profile is the human half of a listing whose substance lives on the Coach
 * card — which carries its own required set (see coachChecklist) — so it asks
 * only for a face, a background and somewhere to look them up.
 *
 * Both bars keep the email: it's the only way anyone gets contacted, and
 * while Google hands it over at signup, nothing in the schema guarantees it,
 * so the check stays rather than trusting that it's always there.
 *
 * `isCoach`: whether the profile has a coach listing (any status). It's a
 * required argument so every caller has to decide which bar applies.
 */
function requiredItems(
  p: RequiredFields,
  { isCoach }: { isCoach: boolean },
): { label: RequiredLabel; done: boolean }[] {
  const item = (label: RequiredLabel, done: boolean) => ({ label, done });
  return isCoach
    ? [
        item("name", !!p.name),
        item("email", !!p.email),
        item("photo", !!p.photo_url),
        item("background", !!p.bio),
        item("a link", hasAnyLink(p)),
      ]
    : [
        item("name", !!p.name),
        item("email", !!p.email),
        item("role", !!p.role_type),
        item("level", !!p.career_stage),
        item("where you hope to grow", !!p.growth_goal),
        item("background", !!p.bio),
        item("a link", hasAnyLink(p)),
      ];
}

export function missingRequired(
  p: RequiredFields,
  opts: { isCoach: boolean },
): RequiredLabel[] {
  return requiredItems(p, opts)
    .filter((i) => !i.done)
    .map((i) => i.label);
}

export function isPublishable(p: RequiredFields, opts: { isCoach: boolean }): boolean {
  return missingRequired(p, opts).length === 0;
}

/**
 * Whether the /p/<id> share page renders for this profile: not archived,
 * vetted (or an approved coach) and publishable. Anything that links to a
 * share page should check this first, or the link lands on a 404.
 */
export function hasPublicProfile(
  p: RequiredFields & Pick<Profile, "vetting_status" | "archived_at">,
  { approvedCoach }: { approvedCoach: boolean },
): boolean {
  return (
    !p.archived_at &&
    (p.vetting_status === "approved" || approvedCoach) &&
    isPublishable(p, { isCoach: approvedCoach })
  );
}

/** The required fields, labelled for the "what's left" card. */
export function profileChecklist(
  profile: RequiredFields,
  opts: { isCoach: boolean },
): ChecklistItem[] {
  return requiredItems(profile, opts).map(({ label, done }) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    done,
  }));
}

/**
 * Progress towards a visible profile — required fields only. Counting the
 * optional ones too (as this used to) meant the number never reached 100%
 * and so never answered the question the user actually has: am I done?
 */
export function profileCompletionPct(profile: RequiredFields, opts: { isCoach: boolean }): number {
  const items = requiredItems(profile, opts);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}
