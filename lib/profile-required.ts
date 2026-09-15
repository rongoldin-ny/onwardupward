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

export function missingRequired(p: RequiredFields): RequiredLabel[] {
  const out: RequiredLabel[] = [];
  if (!p.name) out.push("name");
  if (!p.photo_url) out.push("photo");
  if (!p.email) out.push("email");
  if (!p.location_country) out.push("location");
  if (!p.linkedin_url && !p.portfolio_url && !p.website_url && !p.resume_url) out.push("a link");
  if (!p.bio) out.push("background");
  if (p.years_experience === null || p.years_experience === undefined) out.push("years of experience");
  return out;
}

export function isPublishable(p: RequiredFields): boolean {
  return missingRequired(p).length === 0;
}

/**
 * Every field counts once, across the whole profile surface a user fills in.
 * Weighting the required fields double (as this used to) overstated brand-new
 * accounts, whose name, email, and photo arrive pre-filled from OAuth: three
 * freebies alone read as 29% of a profile the user hadn't touched yet.
 */
export function profileCompletionPct(profile: Profile): number {
  const filled = [
    !!profile.name,
    !!profile.photo_url,
    !!profile.email,
    !!profile.location_country,
    !!(profile.linkedin_url || profile.portfolio_url || profile.website_url || profile.resume_url),
    !!profile.bio,
    profile.years_experience !== null && profile.years_experience !== undefined,
    !!profile.dream_job,
    !!profile.growth_goal,
    !!profile.last_role_text,
    profile.brags.length > 0,
    !!profile.career_stage,
    !!profile.role_type,
    profile.industries.length > 0,
    profile.portfolio_images.length > 0,
    (profile.ai_superpowers?.length ?? 0) > 0,
  ];
  return Math.round((filled.filter(Boolean).length / filled.length) * 100);
}
