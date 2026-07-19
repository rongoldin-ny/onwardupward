import type { CandidateView } from "@/components/CandidateProfileView";
import { getReferences, getWorkHistory, type Profile } from "./db";
import { labelForRoleType } from "./taxonomy";

export async function toCandidateView(profile: Profile): Promise<CandidateView> {
  const firstName = (profile.name ?? "them").split(" ")[0];
  const contactNote =
    profile.contact_preference === "linkedin"
      ? `${firstName} prefers LinkedIn — connect there.`
      : `${firstName} prefers email — replies within a few days.`;

  const [work, references] = await Promise.all([
    getWorkHistory(profile.id),
    getReferences(profile.id),
  ]);

  return {
    id: profile.id,
    name: profile.name ?? "Unnamed",
    photoUrl: profile.photo_url,
    roleLabel: labelForRoleType(profile.role_type),
    city: profile.location_city ?? "Anywhere",
    firstName,
    bio: profile.bio,
    dreamJob: profile.dream_job,
    lastRole: profile.last_role_text,
    brags: profile.brags,
    companies: work
      .map((w) => w.company)
      .filter(Boolean)
      .slice(0, 3) as string[],
    references: references.map((r) => ({
      name: r.full_name ?? "",
      title: r.current_title ?? "",
      linkedin: r.linkedin_url,
    })),
    portfolioUrl: profile.portfolio_url,
    portfolioPassword: profile.portfolio_password,
    portfolioImages: profile.portfolio_images,
    yearsExperience: profile.years_experience,
    industries: profile.industries,
    contactNote,
  };
}
