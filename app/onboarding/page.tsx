import { redirect } from "next/navigation";
import { requireUser, homeFor } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import OnboardingWizard from "./OnboardingWizard";

// Finishing sign-up kicks off Claude auto fill (fetches the portfolio, mirrors
// images) and enrichment post-response via after(); give them room to finish.
export const maxDuration = 300;
export default async function OnboardingPage() {
  const user = await requireUser({ allowUnfinished: true });
  if (user.onboarding_complete) redirect(homeFor(user));

  const coaching = user.role === "coach" || !!(await getCoachByProfileId(user.id));
  return <OnboardingWizard profile={user} coaching={coaching} />;
}
