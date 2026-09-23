import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireVetter } from "@/lib/vetting";
import type { CoachRow } from "@/lib/coach-shared";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";
import AdminTabs from "../AdminTabs";
import CoachClaimList, { type ClaimRow } from "./CoachClaimList";

export const metadata = { title: "Coach claims — onward/upward" };

/**
 * Admin-only: every listing, and where its claim has got to. The outreach
 * list lives here rather than in a spreadsheet because the answer to "has
 * this one been claimed?" is already in the row.
 */
export default async function AdminCoachesPage() {
  await requireVetter();
  const admin = supabaseAdmin();
  const [{ data: coaches }, { data: claims }] = await Promise.all([
    admin.from("coaches").select("*").order("full_name"),
    admin.from("coach_claims").select("coach_id, status").eq("status", "pending"),
  ]);
  const pending = new Set(
    ((claims ?? []) as { coach_id: string }[]).map((c) => c.coach_id),
  );

  const owners = ((coaches ?? []) as CoachRow[])
    .map((c) => c.profile_id)
    .filter((id): id is string => !!id);
  const { data: profiles } = owners.length
    ? await admin.from("profiles").select("id, name, email").in("id", owners)
    : { data: [] };
  const ownerById = new Map(
    ((profiles ?? []) as { id: string; name: string | null; email: string | null }[]).map((p) => [
      p.id,
      p,
    ]),
  );

  const rows: ClaimRow[] = ((coaches ?? []) as CoachRow[]).map((c) => {
    const owner = c.profile_id ? ownerById.get(c.profile_id) : null;
    return {
      id: c.id,
      name: c.full_name,
      company: c.company,
      photoUrl: c.photo_url,
      status: c.status,
      claimedBy: owner ? (owner.name ?? owner.email ?? "Someone") : null,
      hasPendingClaim: pending.has(c.id),
    };
  });

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
        <header className="flex items-center gap-4">
          <Link href="/admin" aria-label="Back" className="text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>

        <main className="mt-2">
          <AdminTabs />
          <Eyebrow className="mt-8">Admin · Coach claims</Eyebrow>
          {/* Mobile keeps just the eyebrow — the list is the page. */}
          <h1 className="mt-4 hidden text-[34px] leading-[1.1] font-black tracking-[-0.02em] text-cream md:block">
            Who has their listing, and who still needs asking.
          </h1>
          <p className="mt-3 hidden max-w-[560px] text-[15px] leading-[1.5] text-secondary md:block">
            Send a coach their listing link — it shows their card with a claim button on it. The
            claim link skips straight to sign-up, which is colder but saves a step for someone
            already signed in.
          </p>

          <CoachClaimList rows={rows} />
        </main>
      </div>
    </PageFrame>
  );
}
