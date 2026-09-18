import { supabaseAdmin } from "./supabase/server";
import { coachListingVisible, type CoachFeed, type CoachRow, type ListingOwner } from "./coach-shared";

export type { CoachFeed, CoachRow } from "./coach-shared";
export { TARGET_MENTEE_OPTIONS, coachLevels, coachFormats, coachPricing } from "./coach-shared";

/**
 * Directory listings: approved first, then curated unclaimed. A claimed
 * listing stays up on the strength of its own fields (see coachListingVisible)
 * — accepting a claim used to hide the card behind the claimant's member
 * profile, which took working listings down the moment they were handed over.
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
    .select("id, name, email, linkedin_url, portfolio_url, website_url, resume_url, archived_at")
    .in("id", claimedIds);
  const owners = new Map(
    ((profiles ?? []) as (ListingOwner & { id: string })[]).map((p) => [p.id, p]),
  );
  return coaches.filter((c) => coachListingVisible(c, owners.get(c.profile_id ?? "")));
}

/**
 * Newsletters for every coach who's added one, for the reading feeds. Carries
 * the coach's name and facets so /reads can attribute and filter each post.
 */
export async function getCoachFeeds(): Promise<CoachFeed[]> {
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("substack_url, full_name, specialties")
    .not("substack_url", "is", null)
    .in("status", ["approved", "unclaimed"]);
  return ((data ?? []) as (Omit<CoachFeed, "substack_url"> & { substack_url: string | null })[])
    .filter((c): c is CoachFeed => !!c.substack_url)
    .map((c) => ({ ...c, specialties: c.specialties ?? [] }));
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

export type ClaimProfile = { id: string; name: string | null; email: string | null; photo_url: string | null };
export type PendingClaim = { id: string; createdAt: string; coach: CoachRow; profile: ClaimProfile };

type ClaimRow = {
  id: string;
  created_at: string;
  coach: CoachRow | null;
  profile: ClaimProfile | null;
};

/** Pending "claim this listing" requests, newest first, for the admin to compare against the coach card. */
export async function getPendingClaims(): Promise<PendingClaim[]> {
  const { data } = await supabaseAdmin()
    .from("coach_claims")
    .select("id, created_at, coach:coaches(*), profile:profiles(id, name, email, photo_url)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as ClaimRow[])
    .filter((r): r is ClaimRow & { coach: CoachRow; profile: ClaimProfile } => !!r.coach && !!r.profile)
    .map((r) => ({ id: r.id, createdAt: r.created_at, coach: r.coach, profile: r.profile }));
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
  // Fill blanks only. A curated listing is researched by hand, and the
  // claimant's profile is often emptier than it — writing nulls straight over
  // the photo, description and website destroyed that work on every claim.
  await admin
    .from("coaches")
    .update({
      ...(p.name ? { full_name: p.name } : {}),
      ...(p.email ? { email: p.email } : {}),
      ...(p.photo_url ? { photo_url: p.photo_url } : {}),
      ...(p.bio ? { short_description: p.bio } : {}),
      ...(p.website_url ? { website: p.website_url } : {}),
    })
    .eq("profile_id", profileId);
}
