"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { arrivalFor } from "@/lib/arrival";
import { currentUser, homeFor } from "@/lib/auth";
import { COACH_CLAIM_COOKIE } from "@/lib/claims";
import { supabaseServer } from "@/lib/supabase/server";
import { recordTermsAcceptance } from "@/lib/terms";

// Two ways in. Google OAuth: app/auth/google/route.ts (start) and
// app/auth/callback/route.ts (return). Email and password: the actions below,
// with app/auth/confirm/route.ts landing the emailed links.

export type AuthState = { error?: string; notice?: string };

const MIN_PASSWORD = 8;

function validEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed") {
    return { error: "Confirm your email first — check your inbox for the link we sent." };
  }
  if (error) {
    return { error: "That email and password don't match. If you joined with Google, use the button above." };
  }

  const user = await currentUser();
  if (!user) return { error: "Something went wrong — try again." };

  const cookieStore = await cookies();
  const claimCoachId = cookieStore.get(COACH_CLAIM_COOKIE)?.value;
  const destination = await arrivalFor(user, {
    claimCoachId,
    next: String(formData.get("next") ?? ""),
  });
  if (claimCoachId) cookieStore.delete(COACH_CLAIM_COOKIE);
  redirect(destination);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name) return { error: "Enter your name." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD) return { error: "Passwords need at least 8 characters." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // full_name is the claim Google sends, so handle_new_user seeds it alike.
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });
  if (error) {
    return {
      error: error.code === "weak_password" ? error.message : "We couldn't sign you up just now. Try again in a minute.",
    };
  }

  // An email that already has an account comes back as a look-alike user with
  // no identities and no email is sent. The notice stays the same either way,
  // so this form can't be used to find out who has an account.
  if (data.user?.identities?.length) {
    // Clicking through the notice is the agreement. Stamped now, not on the
    // confirmation link: that may be opened on another device.
    await recordTermsAcceptance({ id: data.user.id, terms_accepted_at: null }).catch(() => {});
  }
  return {
    notice: "Check your email — we sent you a link to confirm your address. Already have an account? Sign in instead.",
  };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  // Same response either way — don't reveal whether the email has an account.
  return { notice: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: "Passwords need at least 8 characters." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.code === "same_password" || error.code === "weak_password" ? error.message : "That link has expired — request a new one." };
  }
  const user = await currentUser();
  redirect(user ? homeFor(user) : "/signin");
}

export async function chooseRole(role: "candidate" | "recruiter" | "coach") {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.onboarding_complete) redirect(homeFor(user));
  // role_chosen is what the OAuth callback reads to tell a brand-new account
  // from someone who picked 'candidate' on purpose — `role` alone can't say,
  // since that's also the column default.
  if (role === "coach") {
    // The privilege trigger only allows self-serve candidate/recruiter
    // switches; the coach role is granted through the admin client.
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    await supabaseAdmin()
      .from("profiles")
      .update({ role: "coach", role_chosen: true })
      .eq("id", user.id);
  } else {
    const supabase = await supabaseServer();
    await supabase.from("profiles").update({ role, role_chosen: true }).eq("id", user.id);
  }
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
