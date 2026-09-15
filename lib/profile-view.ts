import type { CoachRow } from "./coach-shared";
import { getCoachByProfileId } from "./coaches-db";
import {
  getReferences,
  getWorkHistory,
  type PortfolioImage,
  type Profile,
  type ReferenceRow,
  type WorkHistoryRow,
} from "./db";
import { missingRequired, type RequiredLabel } from "./profile-required";
import { supabaseAdmin } from "./supabase/server";
import type { Superpower } from "./superpowers";
import { labelForCareerStage, labelForRoleType, uniqueCompanies } from "./taxonomy";

export type ProfileUrl = {
  label: "LinkedIn" | "Portfolio" | "Website" | "Résumé";
  href: string;
};

export type PlayerView = {
  roleLabel: string | null;
  careerStageLabel: string | null;
  industries: string[];
  aiSuperpowers: Superpower[];
  companies: string[];
  brags: string[];
  dreamJob: string | null;
  growthGoal: string | null;
  lastRole: string | null;
  portfolioImages: PortfolioImage[];
  references: { name: string; title: string; linkedin: string | null }[];
};

export type ProfileView = {
  id: string;
  name: string;
  firstName: string;
  email: string | null;
  photoUrl: string | null;
  location: string;
  yearsExperience: number | null;
  background: string | null;
  urls: ProfileUrl[];
  portfolioPassword: string | null;
  player: PlayerView | null;
  coach: CoachRow | null;
  missingRequired: RequiredLabel[];
  raw: { profile: Profile | null; work: WorkHistoryRow[]; references: ReferenceRow[] };
};

/**
 * Résumés are private by default (only used server-side for AI summaries and
 * matching) — the link only appears here for the owner, an admin/vetter
 * reviewing an application, or when the owner has opted in via
 * `resume_public`. `canSeePrivateResume` covers the first two.
 */
export function profileUrls(
  p: {
    linkedin_url: string | null;
    portfolio_url: string | null;
    website_url: string | null;
    resume_url: string | null;
    resume_public: boolean;
  },
  opts: { canSeePrivateResume?: boolean } = {},
): ProfileUrl[] {
  const out: ProfileUrl[] = [];
  if (p.linkedin_url) out.push({ label: "LinkedIn", href: p.linkedin_url });
  if (p.portfolio_url) out.push({ label: "Portfolio", href: p.portfolio_url });
  if (p.website_url) out.push({ label: "Website", href: p.website_url });
  if (p.resume_url && (p.resume_public || opts.canSeePrivateResume)) {
    out.push({ label: "Résumé", href: p.resume_url });
  }
  return out;
}

export function locationLabel(p: {
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
}): string {
  return [p.location_city, p.location_state, p.location_country].filter(Boolean).join(", ");
}

/** Pure assembly — usable from server pages and from the test lab. */
export function buildProfileView(
  profile: Profile,
  work: WorkHistoryRow[],
  references: ReferenceRow[],
  coach: CoachRow | null,
  opts: { canSeePrivateResume?: boolean } = {},
): ProfileView {
  const name = profile.name ?? "Unnamed";
  return {
    id: profile.id,
    name,
    firstName: name.split(" ")[0],
    email: profile.email,
    photoUrl: profile.photo_url,
    location: locationLabel(profile),
    yearsExperience: profile.years_experience,
    background: profile.bio,
    urls: profileUrls(profile, opts),
    portfolioPassword: profile.portfolio_password,
    player: {
      roleLabel: profile.role_type ? labelForRoleType(profile.role_type) : null,
      careerStageLabel: profile.career_stage ? labelForCareerStage(profile.career_stage) : null,
      industries: profile.industries,
      aiSuperpowers: profile.ai_superpowers ?? [],
      companies: uniqueCompanies(work.map((w) => w.company)),
      brags: profile.brags,
      dreamJob: profile.dream_job,
      growthGoal: profile.growth_goal,
      lastRole: profile.last_role_text,
      portfolioImages: profile.portfolio_images,
      references: references.map((r) => ({
        name: r.full_name ?? "",
        title: r.current_title ?? "",
        linkedin: r.linkedin_url,
      })),
    },
    coach,
    missingRequired: missingRequired(profile),
    raw: { profile, work, references },
  };
}

export async function toProfileView(
  profile: Profile,
  opts: { admin?: boolean; canSeePrivateResume?: boolean } = {},
): Promise<ProfileView> {
  // Public pages have no signed-in viewer, so RLS-scoped reads come back
  // empty — those callers fetch with the admin client instead.
  const [work, references, coach] = await Promise.all([
    opts.admin
      ? supabaseAdmin()
          .from("work_history")
          .select("*")
          .eq("candidate_id", profile.id)
          .order("sort_order")
          .then(({ data }) => (data ?? []) as WorkHistoryRow[])
      : getWorkHistory(profile.id),
    opts.admin
      ? supabaseAdmin()
          .from("refs")
          .select("*")
          .eq("candidate_id", profile.id)
          .order("sort_order")
          .then(({ data }) => (data ?? []) as ReferenceRow[])
      : getReferences(profile.id),
    getCoachByProfileId(profile.id),
  ]);
  return buildProfileView(profile, work, references, coach, {
    canSeePrivateResume: opts.canSeePrivateResume,
  });
}

/** Curated, unclaimed coach seeds have no profile row — only a Coach face. */
export function coachOnlyProfileView(coach: CoachRow): ProfileView {
  return {
    id: coach.id,
    name: coach.full_name,
    firstName: coach.full_name.split(" ")[0],
    email: null,
    photoUrl: coach.photo_url,
    location: "",
    yearsExperience: null,
    background: coach.short_description,
    urls: coach.website ? [{ label: "Website", href: coach.website }] : [],
    portfolioPassword: null,
    player: null,
    coach,
    missingRequired: [],
    raw: { profile: null, work: [], references: [] },
  };
}
