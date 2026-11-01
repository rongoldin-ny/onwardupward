import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { arrivalFor } from "@/lib/arrival";
import { COACH_CLAIM_COOKIE } from "@/lib/claims";
import type { Profile } from "@/lib/db";
import { supabaseRoute } from "@/lib/supabase/server";

/**
 * Lands email links (sign-up confirmation, password recovery). Verifying the
 * link signs them in. Links arrive in two shapes depending on the Supabase
 * email template: a token_hash + type pair, which works in any browser, or a
 * PKCE `code`, which only works in the browser that asked for the email. A
 * code opened elsewhere still confirms the address (Supabase does that before
 * redirecting here), so /signin tells them to just sign in.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const recovering = type === "recovery" || searchParams.get("next") === "/reset-password";

  const fail = () => NextResponse.redirect(new URL("/signin?error=link", origin));

  const { supabase, applyCookies } = supabaseRoute(request);
  const { error } =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: true };
  if (error) return fail();

  if (recovering) {
    const response = NextResponse.redirect(new URL("/reset-password", origin));
    applyCookies(response);
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return fail();

  const claimCoachId = request.cookies.get(COACH_CLAIM_COOKIE)?.value;
  const destination = await arrivalFor(data as Profile, { claimCoachId });

  const response = NextResponse.redirect(new URL(destination, origin));
  applyCookies(response);
  if (claimCoachId) response.cookies.delete(COACH_CLAIM_COOKIE);
  return response;
}
