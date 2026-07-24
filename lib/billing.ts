import type { Profile } from "./db";

/**
 * Pilot pricing for players and coaches. Purely derived from existing
 * profile/coach-listing state (role, is_supporter, and whether a coach
 * listing exists) — no stored plan column, nothing to keep in sync, and
 * nothing enforced yet. Recruiter billing ($199/mo, profiles.is_paid) is
 * a separate track and untouched here.
 */
export type BillingPlanKey = "player_basic" | "player_supporter" | "coach" | "player_coach";

export const PILOT_PRICING_NOTE = "Pilot pricing — subject to change.";

export const PLAN_INFO: Record<
  BillingPlanKey,
  { label: string; price: string; perks: string[] }
> = {
  player_basic: {
    label: "Player Basic",
    price: "Free",
    perks: ["A profile that gets you found", "Weekly view stats & ranking", "Direct messages from companies"],
  },
  player_supporter: {
    label: "Player Supporter",
    price: "$5/mo",
    perks: [
      "Your profile gets first looks in recruiter searches",
      "First in line for hot opportunities",
      "Early access to new features",
    ],
  },
  coach: {
    label: "Coach",
    price: "$20/mo",
    perks: [
      "A listing in the coach directory",
      "Coaching analytics — impressions, views, and requests",
      "Direct booking links for members",
    ],
  },
  player_coach: {
    label: "Player / Coach",
    price: "$25/mo",
    perks: [
      "Everything in Player Supporter",
      "Everything in Coach",
      "One account for your player profile and your coach listing",
    ],
  },
};

/** Which of the four tiers a user is on today. */
export function deriveBillingPlan(user: Profile, hasCoachListing: boolean): BillingPlanKey {
  if (user.role === "coach") return "coach";
  if (hasCoachListing) return "player_coach";
  return user.is_supporter ? "player_supporter" : "player_basic";
}
