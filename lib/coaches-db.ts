import { supabaseAdmin } from "./supabase/server";
import type { CoachRow } from "./coach-shared";

export type { CoachRow } from "./coach-shared";
export { TARGET_MENTEE_OPTIONS, coachLevels, coachFormats, coachPricing } from "./coach-shared";

/** Directory listings: approved first, then curated unclaimed. */
export async function getDirectoryCoaches(): Promise<CoachRow[]> {
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("*")
    .in("status", ["approved", "unclaimed"])
    .order("status", { ascending: true }) // approved < unclaimed
    .order("created_at", { ascending: true });
  return (data ?? []) as CoachRow[];
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
