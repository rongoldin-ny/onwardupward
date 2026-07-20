import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Lands email links (signup confirmation, password recovery). Verifies the
 * token, which signs the user in, then routes them onward. Supabase links
 * arrive in two shapes depending on the email template: a direct
 * token_hash + type pair, or a PKCE `code` after bouncing through
 * Supabase's own /auth/v1/verify endpoint — handle both.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await supabaseServer();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (next) redirect(next);
      redirect(type === "recovery" ? "/reset-password" : "/role");
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next ?? "/role");
  }

  redirect("/signin?error=link-expired");
}
