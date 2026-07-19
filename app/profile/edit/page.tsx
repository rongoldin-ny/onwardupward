import { requireCandidate } from "@/lib/auth";
import { getReferences, getWorkHistory } from "@/lib/db";
import CandidateWizard from "@/app/onboarding/CandidateWizard";

export default async function ProfileEditPage() {
  const user = await requireCandidate();
  const [work, references] = await Promise.all([
    getWorkHistory(user.id),
    getReferences(user.id),
  ]);
  return (
    <CandidateWizard
      profile={user}
      work={work}
      references={references}
      exitHref="/dashboard"
    />
  );
}
