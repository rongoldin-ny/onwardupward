"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";

export type AuthState = { error?: string; notice?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match." };

  const user = await currentUser();
  if (!user) return { error: "Something went wrong — try again." };
  redirect(homeFor(user));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Passwords need at least 8 characters." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "candidate" }, // provisional until role select
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });
  if (error) return { error: error.message };

  // With email confirmation enabled there's no session yet — tell them to
  // check their inbox. With it disabled we're signed in and can continue.
  if (!data.session) {
    return { notice: "Check your email — we sent a confirmation link." };
  }
  redirect("/role");
}

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

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  // Same response either way — don't reveal whether the email has an account.
  return { notice: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Passwords need at least 8 characters." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  const user = await currentUser();
  redirect(user ? homeFor(user) : "/signin");
}
