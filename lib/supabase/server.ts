import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Request-scoped client authenticated as the current user (via auth cookies).
 * All normal reads/writes go through this so RLS applies.
 */
export async function supabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies; the proxy refreshes them.
          }
        },
      },
    },
  );
}

/**
 * Client for Route Handlers that build their own redirect response.
 *
 * The OAuth routes can't use `supabaseServer()`: they return a `NextResponse`
 * they construct themselves, so cookies written through `cookies()` never
 * reach the browser. Auth writes real cookies here — the PKCE code verifier
 * on the way out, the session on the way back — so collect them and hand
 * them to `applyCookies(response)` before returning.
 */
export function supabaseRoute(request: NextRequest): {
  supabase: SupabaseClient;
  applyCookies: (response: NextResponse) => void;
} {
  const pending: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pending.push(...cookiesToSet);
        },
      },
    },
  );

  return {
    supabase,
    applyCookies(response) {
      for (const { name, value, options } of pending) {
        response.cookies.set(name, value, options);
      }
    },
  };
}

/**
 * Service-role client that bypasses RLS. Server-only. Used for: storage
 * uploads, cross-user aggregates (stats/percentile), enrichment writes,
 * company signals, and admin/seed tooling. Never expose to the browser.
 */
export function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
