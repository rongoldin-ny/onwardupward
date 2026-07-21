import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import type { Profile } from "./db";

/** The signed-in user's profile row, or null. */
export async function currentUser(): Promise<Profile | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

/** Where a signed-in user's "home" is, per PRD §7.2. */
export function homeFor(user: Profile): string {
  if (user.role === "admin") return "/admin";
  if (!user.onboarding_complete) return "/onboarding";
  if (user.role === "candidate") return "/dashboard";
  if (user.role === "coach") return "/coach";
  return user.is_paid ? "/search" : "/subscribe";
}

export async function requireUser(): Promise<Profile> {
  const user = await currentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireCandidate(): Promise<Profile> {
  const user = await requireUser();
  if (user.role !== "candidate") redirect(homeFor(user));
  return user;
}

export async function requirePaidRecruiter(): Promise<Profile> {
  const user = await requireUser();
  if (user.role === "admin") return user; // admins can see everything
  if (user.role !== "recruiter") redirect(homeFor(user));
  if (!user.onboarding_complete) redirect("/onboarding");
  if (!user.is_paid) redirect("/subscribe");
  return user;
}

export async function requireAdmin(): Promise<Profile> {
  const user = await requireUser();
  if (user.role !== "admin") redirect(homeFor(user));
  return user;
}
