"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";

// Sign-in and sign-up both run through Google OAuth — see
// app/auth/google/route.ts (start) and app/auth/callback/route.ts (return).

export async function chooseRole(role: "candidate" | "recruiter" | "coach") {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.onboarding_complete) redirect(homeFor(user));
  if (role === "coach") {
    // The privilege trigger only allows self-serve candidate/recruiter
    // switches; the coach role is granted through the admin client.
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    await supabaseAdmin().from("profiles").update({ role: "coach" }).eq("id", user.id);
  } else {
    const supabase = await supabaseServer();
    await supabase.from("profiles").update({ role }).eq("id", user.id);
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
