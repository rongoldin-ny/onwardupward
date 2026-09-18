import { publicCoach, type CoachRow } from "./coach-shared";
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
  background: string | null;
  urls: ProfileUrl[];
  portfolioPassword: string | null;
  player: PlayerView | null;
  coach: CoachRow | null;
  /** This viewer may message them through the platform (see allow_coach_contact). */
  canContact: boolean;
  missingRequired: RequiredLabel[];
  raw: { profile: Profile | null; work: WorkHistoryRow[]; references: ReferenceRow[] };
};

/**
 * Résumés are private by default (only used server-side for AI summaries and
 * matching) — the link only appears here for the owner, an admin/vetter
 * reviewing an application (`canSeePrivateResume`), or when the owner has
 * opted in via `resume_public` AND the viewer is a coach or hiring manager
 * (`canSeePublicResume`) — regular members never get a resume link, opted in
 * or not.
 */
export function profileUrls(
  p: {
    linkedin_url: string | null;
    portfolio_url: string | null;
    website_url: string | null;
    resume_url: string | null;
    resume_public: boolean;
  },
  opts: { canSeePrivateResume?: boolean; canSeePublicResume?: boolean } = {},
): ProfileUrl[] {
  const out: ProfileUrl[] = [];
  if (p.linkedin_url) out.push({ label: "LinkedIn", href: p.linkedin_url });
  if (p.portfolio_url) out.push({ label: "Portfolio", href: p.portfolio_url });
  if (p.website_url) out.push({ label: "Website", href: p.website_url });
  if (
    p.resume_url &&
    (opts.canSeePrivateResume || (p.resume_public && opts.canSeePublicResume))
  ) {
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

/** Who's looking, and what that lets them see. Anything not granted is stripped server-side. */
export type ViewerAccess = {
  /** The profile's own member: full record, editable. */
  isOwner?: boolean;
  /** Admin/vetter review: email and private résumé too. */
  isAdmin?: boolean;
  /** Has an approved coach listing (or coaches by role) — gets the Contact button. */
  isCoach?: boolean;
  /** Owner-approved résumé sharing, for coaches and hiring managers. */
  canSeePublicResume?: boolean;
  /** Coaches (and admins) get portfolio passwords so they can open the work. */
  canSeePortfolioPassword?: boolean;
};

/**
 * Every profile column, classified. `shared` fields render on the profile for
 * any viewer; `private` fields are nulled before the view reaches the browser
 * unless ViewerAccess grants them. Keyed by `keyof Profile`, so adding a
 * column without classifying it is a type error rather than a silent leak.
 */
const PROFILE_FIELD_ACCESS: Record<keyof Profile, "shared" | "private"> = {
  id: "shared",
  role: "shared",
  name: "shared",
  email: "private",
  photo_url: "shared",
  linkedin_url: "shared",
  location_country: "shared",
  location_state: "shared",
  location_city: "shared",
  role_type: "shared",
  career_stage: "shared",
  bio: "shared",
  ai_bio: "private",
  dream_job: "shared",
  growth_goal: "shared",
  last_role_text: "shared",
  brags: "shared",
  portfolio_url: "shared",
  portfolio_password: "private",
  website_url: "shared",
  resume_url: "private",
  resume_public: "shared",
  ai_superpowers: "shared",
  portfolio_images: "shared",
  industries: "shared",
  contact_preference: "private",
  allow_coach_contact: "shared",
  terms_accepted_at: "private",
  is_paid: "private",
  is_supporter: "private",
  notification_prefs: "private",
  role_chosen: "shared",
  onboarding_complete: "shared",
  vetting_status: "shared",
  archived_at: "private",
  last_digest_sent_at: "private",
  last_sign_in_at: "private",
  created_at: "shared",
  updated_at: "shared",
};

/** Placeholder values for private fields that can't be null. */
const REDACTED: Partial<Profile> = {
  is_paid: false,
  is_supporter: false,
  contact_preference: "email",
  notification_prefs: { messages: false, weekly_digest: false, product_updates: false },
};

function redactProfile(profile: Profile, grants: Partial<Record<keyof Profile, boolean>>): Profile {
  const out = { ...profile } as Record<string, unknown>;
  for (const [key, access] of Object.entries(PROFILE_FIELD_ACCESS) as [keyof Profile, string][]) {
    if (access === "private" && !grants[key]) out[key] = key in REDACTED ? REDACTED[key] : null;
  }
  return out as Profile;
}

/** Pure assembly — usable from server pages and from the test lab. */
export function buildProfileView(
  profile: Profile,
  work: WorkHistoryRow[],
  references: ReferenceRow[],
  coach: CoachRow | null,
  access: ViewerAccess = {},
): ProfileView {
  const name = profile.name ?? "Unnamed";
  const urls = profileUrls(profile, {
    canSeePrivateResume: access.isOwner || access.isAdmin,
    canSeePublicResume: access.canSeePublicResume,
  });
  const canSeePassword = !!(access.isOwner || access.isAdmin || access.canSeePortfolioPassword);
  // Owners get their full record (they edit it); everyone else gets only what they may see.
  const visible = access.isOwner
    ? profile
    : redactProfile(profile, {
        email: access.isAdmin,
        portfolio_password: canSeePassword,
        resume_url: urls.some((u) => u.label === "Résumé"),
      });
  return {
    id: profile.id,
    name,
    firstName: name.split(" ")[0],
    email: visible.email,
    photoUrl: profile.photo_url,
    location: locationLabel(profile),
    background: profile.bio,
    urls,
    portfolioPassword: visible.portfolio_password,
    // Coaches reaching members is the one direction of outreach the platform
    // opens, and only to people who left it open. Admins too, matching both the
    // `admin || isCoach` grants above and what contactMember actually accepts.
    canContact:
      !access.isOwner && !!(access.isCoach || access.isAdmin) && profile.allow_coach_contact,
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
    coach: coach && !access.isOwner && !access.isAdmin ? publicCoach(coach) : coach,
    missingRequired: missingRequired(profile, { isCoach: !!coach }),
    raw: { profile: visible, work, references },
  };
}

export async function toProfileView(
  profile: Profile,
  opts: { admin?: boolean } & ViewerAccess = {},
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
  return buildProfileView(profile, work, references, coach, opts);
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
    background: coach.short_description,
    urls: coach.website ? [{ label: "Website", href: coach.website }] : [],
    portfolioPassword: null,
    player: null,
    coach: publicCoach(coach),
    // No profile row behind a curated seed — the listing's own CTA is the route in.
    canContact: false,
    missingRequired: [],
    raw: { profile: null, work: [], references: [] },
  };
}
