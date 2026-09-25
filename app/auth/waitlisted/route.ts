import { NextResponse, type NextRequest } from "next/server";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { supabaseRoute } from "@/lib/supabase/server";

/**
 * Waitlisted accounts aren't kept signed in: there's nothing for them to use
 * yet. Anything that finds one signed in (a fresh Google sign-in, an old
 * session) sends them here, which quietly signs them out and shows where they
 * stand — or, if they were turned down (as a member, or their coach card),
 * says so. A Route Handler because Server Components can't clear cookies.
 */
export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = supabaseRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // "member" or "coach" when they were turned down — the waitlist words it differently.
  let rejected: "member" | "coach" | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, vetting_status")
      .eq("id", user.id)
      .maybeSingle();
    const isCoach = data?.role === "coach";
    if (
      data?.vetting_status === "rejected" ||
      (isCoach && (await getCoachByProfileId(user.id))?.status === "rejected")
    ) {
      rejected = isCoach ? "coach" : "member";
    }
  }
  await supabase.auth.signOut();
  const response = NextResponse.redirect(
    new URL(`/waitlist?${rejected ? `rejected=${rejected}` : "listed=1"}`, request.nextUrl.origin),
  );
  applyCookies(response);
  return response;
}
