import { requireCandidate } from "@/lib/auth";
import { getReferences, getWorkHistory } from "@/lib/db";
import { getCommunitySkills } from "@/lib/superpowers-server";
import CandidateWizard from "@/app/onboarding/CandidateWizard";

// Enrichment runs post-response via after(); give the function time to finish it.
export const maxDuration = 60;
export default async function ProfileEditPage() {
  const user = await requireCandidate();
  const [work, references, communitySkills] = await Promise.all([
    getWorkHistory(user.id),
    getReferences(user.id),
    getCommunitySkills(),
  ]);
  return (
    <CandidateWizard
      profile={user}
      work={work}
      references={references}
      communitySkills={communitySkills}
      exitHref="/dashboard"
    />
  );
}
