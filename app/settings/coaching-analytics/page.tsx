import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { coachAnalytics } from "@/lib/coach-analytics";
import CoachAnalyticsTiles from "@/components/CoachAnalyticsTiles";
import SettingsShell from "../SettingsShell";

export default async function CoachingAnalyticsPage() {
  const user = await requireCandidate();
  const listing = await getCoachByProfileId(user.id);
  if (!listing) redirect("/settings/coaching");

  const analytics = await coachAnalytics(listing.id);

  return (
    <SettingsShell
      title="Coaching analytics."
      subtitle="How members are finding and booking you."
    >
      <CoachAnalyticsTiles analytics={analytics} />
    </SettingsShell>
  );
}
