import type { Profile } from "./db";

/** Client-safe: the fields every profile must fill before it's visible. */

export type RequiredLabel =
  | "name"
  | "photo"
  | "email"
  | "location"
  | "a link"
  | "background"
  | "years of experience";

export type RequiredFields = Pick<
  Profile,
  | "name"
  | "photo_url"
  | "email"
  | "location_country"
  | "linkedin_url"
  | "portfolio_url"
  | "website_url"
  | "resume_url"
  | "bio"
  | "years_experience"
>;

/**
 * `isCoach`: whether the profile has a coach listing (any status). Years of
 * experience is only required of coaches — members can leave it blank. It's a
 * required argument so every caller has to decide, rather than silently
 * holding members to the coach bar.
 */
export function missingRequired(p: RequiredFields, { isCoach }: { isCoach: boolean }): RequiredLabel[] {
  const out: RequiredLabel[] = [];
  if (!p.name) out.push("name");
  if (!p.photo_url) out.push("photo");
  if (!p.email) out.push("email");
  if (!p.location_country) out.push("location");
  if (!p.linkedin_url && !p.portfolio_url && !p.website_url && !p.resume_url) out.push("a link");
  if (!p.bio) out.push("background");
  if (isCoach && (p.years_experience === null || p.years_experience === undefined)) {
    out.push("years of experience");
  }
  return out;
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

export type ChecklistItem = { label: string; done: boolean; required: boolean };

/**
 * Everything a member can fill in, in the order it appears on the profile.
 * `required` items gate visibility (see missingRequired); the rest round it out.
 */
export function profileChecklist(profile: Profile): ChecklistItem[] {
  const item = (label: string, done: boolean, required = false) => ({ label, done, required });
  return [
    item("Name", !!profile.name, true),
    item("Photo", !!profile.photo_url, true),
    item("Email", !!profile.email, true),
    item("Location", !!profile.location_country, true),
    item(
      "A link or résumé",
      !!(profile.linkedin_url || profile.portfolio_url || profile.website_url || profile.resume_url),
      true,
    ),
    item("Background", !!profile.bio, true),
    item("Years of experience", profile.years_experience !== null && profile.years_experience !== undefined),
    item("Role & level", !!profile.role_type && !!profile.career_stage),
    item("Where you hope to grow", !!profile.growth_goal),
    item("Industries", profile.industries.length > 0),
    item("AI superpowers", (profile.ai_superpowers?.length ?? 0) > 0),
    item("The dream job", !!profile.dream_job),
    item("Your last role", !!profile.last_role_text),
    item("Humblebrags", profile.brags.length > 0),
    item("Portfolio images", profile.portfolio_images.length > 0),
  ];
}

/**
 * Every field counts once, across the whole profile surface a user fills in.
 * Weighting the required fields double (as this used to) overstated brand-new
 * accounts, whose name, email, and photo arrive pre-filled from OAuth: three
 * freebies alone read as 29% of a profile the user hadn't touched yet.
 */
export function profileCompletionPct(profile: Profile): number {
  const items = profileChecklist(profile);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}
