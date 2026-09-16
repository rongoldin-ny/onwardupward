import { getCoachByProfileId } from "./coaches-db";
import type { Profile } from "./db";
import { isVetter } from "./vetting";

/**
 * What a signed-in viewer may see on someone else's profile. Portfolio
 * passwords are for coaches (anyone with an approved coach listing) and
 * admins; résumés the owner chose to share go to coaches and hiring managers.
 */
export async function accessFor(viewer: Profile | null) {
  if (!viewer) {
    return { isAdmin: false, isCoach: false, canSeePortfolioPassword: false, canSeePublicResume: false };
  }
  const admin = isVetter(viewer);
  // Admins used to skip this lookup, which was harmless while everything they
  // could see was granted by `admin` anyway — but it also made an admin who
  // coaches read as not-a-coach, and isCoach now decides who can reach members.
  const listing = viewer.role === "coach" ? null : await getCoachByProfileId(viewer.id);
  const isCoach = viewer.role === "coach" || listing?.status === "approved";
  return {
    isAdmin: admin,
    isCoach,
    canSeePortfolioPassword: admin || isCoach,
    canSeePublicResume: isCoach || viewer.role === "recruiter",
  };
}
