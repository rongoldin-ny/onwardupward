import { supabaseAdmin } from "./supabase/server";
import type { CoachRow } from "./coach-shared";
import { isPublishable, type RequiredFields } from "./profile-required";

export type { CoachRow } from "./coach-shared";
export { TARGET_MENTEE_OPTIONS, coachLevels, coachFormats, coachPricing } from "./coach-shared";

/**
 * Directory listings: approved first, then curated unclaimed. Claimed
 * listings only appear once their owner's profile has the required fields.
 */
export async function getDirectoryCoaches(): Promise<CoachRow[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("coaches")
    .select("*")
    .in("status", ["approved", "unclaimed"])
    .order("status", { ascending: true }) // approved < unclaimed
    .order("created_at", { ascending: true });
  const coaches = (data ?? []) as CoachRow[];

  const claimedIds = coaches.map((c) => c.profile_id).filter((id): id is string => !!id);
  if (claimedIds.length === 0) return coaches;
  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, name, photo_url, email, location_country, linkedin_url, portfolio_url, website_url, resume_url, bio, years_experience",
    )
    .in("id", claimedIds);
  const publishable = new Set(
    ((profiles ?? []) as (RequiredFields & { id: string })[])
      .filter((p) => isPublishable(p))
      .map((p) => p.id),
  );
  return coaches.filter((c) => !c.profile_id || publishable.has(c.profile_id));
}

export async function getPendingCoaches(): Promise<CoachRow[]> {
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []) as CoachRow[];
}

export async function getCoachByProfileId(profileId: string): Promise<CoachRow | null> {
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return (data as CoachRow) ?? null;
}

/**
 * The profile is the source of truth for a claimed coach's identity; the
 * coaches row keeps a copy so the directory query stays join-free.
 */
export async function syncCoachIdentity(profileId: string): Promise<void> {
  const admin = supabaseAdmin();
  const { data: p } = await admin
    .from("profiles")
    .select("name, email, photo_url, bio, website_url")
    .eq("id", profileId)
    .maybeSingle();
  if (!p) return;
  await admin
    .from("coaches")
    .update({
      ...(p.name ? { full_name: p.name } : {}),
      email: p.email,
      photo_url: p.photo_url,
      short_description: p.bio,
      website: p.website_url,
    })
    .eq("profile_id", profileId);
}
