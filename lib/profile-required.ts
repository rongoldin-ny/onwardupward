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

/** Required fields count double; the optional player fields fill in the rest. */
export function profileCompletionPct(profile: Profile): number {
  const required = missingRequired(profile);
  const requiredTotal = 7;
  const optional = [
    !!profile.dream_job,
    !!profile.last_role_text,
    profile.brags.length > 0,
    !!profile.career_stage,
    !!profile.role_type,
    profile.industries.length > 0,
    profile.portfolio_images.length > 0,
  ];
  const done = (requiredTotal - required.length) * 2 + optional.filter(Boolean).length;
  const total = requiredTotal * 2 + optional.length;
  return Math.round((done / total) * 100);
}
