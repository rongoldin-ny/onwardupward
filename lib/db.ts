import { supabaseAdmin, supabaseServer } from "./supabase/server";

/**
 * Data types + shared helpers, backed by Supabase Postgres.
 * jsonb columns arrive as native values (arrays/objects), booleans as booleans
 * — unlike the old SQLite layer where everything was strings/ints.
 */

export type PortfolioImage = {
  url: string;
  company: string;
  caption: string;
  year: string;
};

export type NotificationPrefs = {
  messages: boolean;
  weekly_digest: boolean;
  product_updates: boolean;
};

export type Profile = {
  id: string;
  role: "candidate" | "recruiter" | "coach" | "admin";
  name: string | null;
  email: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  location_country: string | null;
  location_state: string | null;
  location_city: string | null;
  role_type: string | null;
  career_stage: string | null;
  bio: string | null;
  ai_bio: string | null;
  dream_job: string | null;
  last_role_text: string | null;
  brags: string[];
  portfolio_url: string | null;
  portfolio_password: string | null;
  resume_url: string | null;
  ai_superpowers: { skill: string; xp: "basic" | "fluent" | "expert" }[];
  portfolio_images: PortfolioImage[];
  years_experience: number | null;
  industries: string[];
  contact_preference: "email" | "linkedin";
  is_paid: boolean;
  is_supporter: boolean;
  notification_prefs: NotificationPrefs;
  onboarding_complete: boolean;
  vetting_status: "pending" | "approved";
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkHistoryRow = {
  id: string;
  candidate_id: string;
  title: string | null;
  company: string | null;
  sort_order: number;
};

export type ReferenceRow = {
  id: string;
  candidate_id: string;
  full_name: string | null;
  current_title: string | null;
  linkedin_url: string | null;
  sort_order: number;
};

export async function trackEvent(
  userId: string | null,
  eventType: "profile_view" | "element_click" | "search_query" | "message_sent" | "page_view" | "coach_view",
  targetProfileId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("analytics_events").insert({
    user_id: userId,
    target_profile_id: targetProfileId,
    event_type: eventType,
    metadata,
  });
  if (error) console.error("trackEvent failed:", error.message);
}

export async function getWorkHistory(candidateId: string): Promise<WorkHistoryRow[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("work_history")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("sort_order");
  return (data ?? []) as WorkHistoryRow[];
}

export async function getReferences(candidateId: string): Promise<ReferenceRow[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("refs")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("sort_order");
  return (data ?? []) as ReferenceRow[];
}

/** Admin-client profile fetch for contexts without a request (enrichment). */
export async function getProfileById(id: string): Promise<Profile | null> {
  const { data } = await supabaseAdmin().from("profiles").select("*").eq("id", id).single();
  return (data as Profile) ?? null;
}
