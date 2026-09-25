import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import type { Profile } from "./db";

/** The signed-in user's profile row, or null. Memoized per-request — the
 * global nav and each page both call this without doubling the DB round trip. */
export const currentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
});

/** Where a signed-in user's "home" is, per PRD §7.2. */
export function homeFor(user: Profile): string {
  if (user.role === "admin") return "/admin";
  if (onWaitlist(user)) return WAITLISTED;
  if (!user.onboarding_complete) return "/onboarding";
  if (user.role === "candidate") return "/dashboard";
  if (user.role === "coach") return "/coach";
  return user.is_paid ? "/search" : "/subscribe";
}

/** Sign-in url that remembers where the visitor was actually headed. */
export async function signInPath(): Promise<string> {
  const path = (await headers()).get("x-pathname");
  return path?.startsWith("/") && !path.startsWith("/signin") && !path.startsWith("/signup")
    ? `/signin?next=${encodeURIComponent(path)}`
    : "/signin";
}

/** Signs a waitlisted account out and shows the waitlist screen — see the route. */
const WAITLISTED = "/auth/waitlisted";

/**
 * Finished onboarding but not let in yet. Admins and the vetting account are
 * never held back, so a stray flag can't lock out the people who clear it.
 */
export function onWaitlist(user: Profile): boolean {
  return (
    !!user.waitlisted_at &&
    user.role !== "admin" &&
    (user.email ?? "").toLowerCase() !== "r@rongoldin.com"
  );
}

/**
 * Every signed-in page and action goes through here, so this is where the
 * waitlist signs people out and holds them at /waitlist until they're let in.
 */
export async function requireUser(): Promise<Profile> {
  const user = await currentUser();
  if (!user) redirect(await signInPath());
  if (onWaitlist(user)) redirect(WAITLISTED);
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
