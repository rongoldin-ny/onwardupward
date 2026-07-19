import { requireCandidate } from "@/lib/auth";
import { toCandidateView } from "@/lib/candidate-view";
import CandidateProfileView from "@/components/CandidateProfileView";

export default async function ProfilePreviewPage() {
  const user = await requireCandidate();
  return <CandidateProfileView candidate={await toCandidateView(user)} mode="preview" />;
}
