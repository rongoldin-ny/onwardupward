"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";
import { discardCoachDraft, startCoachDraft } from "@/lib/coaches-db";

// Sign-in and sign-up both run through Google OAuth — see
// app/auth/google/route.ts (start) and app/auth/callback/route.ts (return).

export async function chooseRoles(picked: ("candidate" | "coach")[]) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.onboarding_complete) redirect(homeFor(user));
  const seeking = picked.includes("candidate");
  const coaching = picked.includes("coach");
  if (!seeking && !coaching) redirect("/role");
  // Someone doing both is a member with a coaching card, the same as a member
  // who adds one later: only members get matched with coaches, and an approved
  // card already lets them work as a coach (see lib/viewer-access.ts).
  // role_chosen is what the OAuth callback reads to tell a brand-new account
  // from someone who picked 'candidate' on purpose — `role` alone can't say,
  // since that's also the column default. The admin client because the
  // privilege trigger doesn't allow self-serve moves to or from coach.
  await supabaseAdmin()
    .from("profiles")
    .update({ role: seeking ? "candidate" : "coach", role_chosen: true })
    .eq("id", user.id);
  if (seeking && coaching) await startCoachDraft(user);
  else if (seeking) await discardCoachDraft(user.id);
  redirect("/onboarding");
}

/**
 * Step 1's back arrow: back to the role picker to choose again. A server
 * redirect, like the picker's own Continue, rather than a client-side push.
 */
export async function backToRoles() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.onboarding_complete) redirect(homeFor(user));
  redirect("/role");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
