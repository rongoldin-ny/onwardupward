import { NextResponse, type NextRequest } from "next/server";
import { COACH_CLAIM_COOKIE } from "@/lib/claims";

/**
 * Entry point for "this is me" on a shared coach listing: remembers which
 * listing they mean, then hands off to the normal signup. The auth callback
 * consumes the cookie once the account exists.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const { origin } = request.nextUrl;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.redirect(new URL("/signup", origin));
  }

  const response = NextResponse.redirect(new URL("/signup", origin));
  response.cookies.set(COACH_CLAIM_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60, // an hour is plenty to finish a Google signup
  });
  return response;
}
