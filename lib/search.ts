import { supabaseServer } from "./supabase/server";
import { getWorkHistory, type Profile } from "./db";
import { labelForRoleType, uniqueCompanies } from "./taxonomy";

export type SearchFilters = {
  role: string;
  stages: string[]; // empty = any
  location: string; // country; empty = anywhere
  q: string;
};

export type ResultCard = {
  id: string;
  name: string;
  photoUrl: string | null;
  roleLabel: string;
  city: string;
  isSupporter: boolean;
  bio: string;
  companies: string[];
};

/**
 * PRD §10 — structured filters in SQL, free-text matched in JS across the
 * profile's text fields (including ai_bio and industries). RLS already
 * limits this to paid recruiters/admins.
 */
export async function searchCandidates(filters: SearchFilters): Promise<ResultCard[]> {
  const supabase = await supabaseServer();
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "candidate")
    .eq("onboarding_complete", true)
    .eq("vetting_status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.role) query = query.eq("role_type", filters.role);
  if (filters.stages.length > 0) query = query.in("career_stage", filters.stages);
  if (filters.location) query = query.eq("location_country", filters.location);

  const { data } = await query;
  let rows = (data ?? []) as Profile[];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((p) =>
      [p.bio, p.ai_bio, p.dream_job, p.last_role_text, p.brags.join(" "), p.industries.join(" ")]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(q)),
    );
  }
  // Supporters rank first; recency breaks ties within each group.
  rows = rows
    .sort((a, b) => Number(b.is_supporter) - Number(a.is_supporter))
    .slice(0, 50);

  return Promise.all(
    rows.map(async (p) => ({
      id: p.id,
      name: p.name ?? "Unnamed",
      photoUrl: p.photo_url,
      roleLabel: labelForRoleType(p.role_type),
      city: p.location_city ?? "Anywhere",
      isSupporter: p.is_supporter ?? false,
      bio: p.bio ?? "",
      companies: uniqueCompanies((await getWorkHistory(p.id)).map((w) => w.company)),
    })),
  );
}
