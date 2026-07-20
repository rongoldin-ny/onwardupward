import type { CandidateView } from "@/components/CandidateProfileView";
import { getReferences, getWorkHistory, type Profile, type ReferenceRow, type WorkHistoryRow } from "./db";
import { supabaseAdmin } from "./supabase/server";
import { labelForRoleType } from "./taxonomy";

/** Company chips: each employer once (case-insensitive), first spelling wins. */
export function uniqueCompanies(names: (string | null | undefined)[], limit = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name?.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

export async function toCandidateView(
  profile: Profile,
  opts: { admin?: boolean } = {},
): Promise<CandidateView> {
  const firstName = (profile.name ?? "them").split(" ")[0];
  const contactNote =
    profile.contact_preference === "linkedin"
      ? `${firstName} prefers LinkedIn — connect there.`
      : `${firstName} prefers email — replies within a few days.`;

  // Public share pages have no signed-in viewer, so RLS-scoped reads come
  // back empty — those callers fetch with the admin client instead.
  const [work, references] = opts.admin
    ? await Promise.all([
        supabaseAdmin()
          .from("work_history")
          .select("*")
          .eq("candidate_id", profile.id)
          .order("sort_order")
          .then(({ data }) => (data ?? []) as WorkHistoryRow[]),
        supabaseAdmin()
          .from("refs")
          .select("*")
          .eq("candidate_id", profile.id)
          .order("sort_order")
          .then(({ data }) => (data ?? []) as ReferenceRow[]),
      ])
    : await Promise.all([getWorkHistory(profile.id), getReferences(profile.id)]);

  return {
    id: profile.id,
    name: profile.name ?? "Unnamed",
    isSupporter: profile.is_supporter ?? false,
    photoUrl: profile.photo_url,
    roleLabel: labelForRoleType(profile.role_type),
    city: profile.location_city ?? "Anywhere",
    firstName,
    bio: profile.bio,
    dreamJob: profile.dream_job,
    lastRole: profile.last_role_text,
    brags: profile.brags,
    companies: uniqueCompanies(work.map((w) => w.company)),
    references: references.map((r) => ({
      name: r.full_name ?? "",
      title: r.current_title ?? "",
      linkedin: r.linkedin_url,
    })),
    linkedinUrl: profile.linkedin_url,
    portfolioUrl: profile.portfolio_url,
    portfolioPassword: profile.portfolio_password,
    portfolioImages: profile.portfolio_images,
    yearsExperience: profile.years_experience,
    industries: profile.industries,
    contactNote,
  };
}
