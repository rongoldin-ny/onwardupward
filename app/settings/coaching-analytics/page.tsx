import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { coachAnalytics, getCoachViewers } from "@/lib/coach-analytics";
import { getViewerMatches } from "@/lib/coach-match";
import CoachAnalyticsTiles from "@/components/CoachAnalyticsTiles";
import CoachViewers from "@/components/CoachViewers";
import { Eyebrow } from "@/components/ui";
import SettingsShell from "../SettingsShell";

export default async function CoachingAnalyticsPage() {
  const user = await requireCandidate();
  const listing = await getCoachByProfileId(user.id);
  if (!listing) redirect("/settings/coaching");

  const [analytics, viewers] = await Promise.all([
    coachAnalytics(listing.id),
    getCoachViewers(listing.id),
  ]);
  const matches = await getViewerMatches(
    listing,
    viewers.map((v) => v.profile),
  );

  return (
    <SettingsShell
      title="Coaching analytics."
      subtitle="How members are finding and booking you."
      size="wide"
    >
      <CoachAnalyticsTiles analytics={analytics} bookingUrl={listing.booking_url} />
      <Eyebrow className="mt-9">Who&apos;s looked at you</Eyebrow>
      <CoachViewers viewers={viewers} matches={matches} />
    </SettingsShell>
  );
}
