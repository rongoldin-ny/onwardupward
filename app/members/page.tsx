import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireVetter } from "@/lib/vetting";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";
import MembersDirectory, { type MemberRow } from "./MembersDirectory";

export const metadata = { title: "Members — onward/upward" };

/**
 * Admin-only member directory — the Coaches directory's counterpart for
 * everyone who joined as a member. Each card opens the vetting review page,
 * which shows the full profile (private résumé included) plus approval state.
 */
export default async function MembersPage() {
  await requireVetter();
  const admin = supabaseAdmin();
  const [{ data: profiles }, { data: listings }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, name, email, photo_url, role_type, career_stage, location_city, location_state, location_country, growth_goal, bio, vetting_status, onboarding_complete, created_at",
      )
      .eq("role", "candidate")
      .order("created_at", { ascending: false }),
    admin.from("coaches").select("profile_id, status").not("profile_id", "is", null),
  ]);
  const coachStatus = new Map(
    ((listings ?? []) as { profile_id: string; status: string }[]).map((c) => [c.profile_id, c.status]),
  );
  const members: MemberRow[] = ((profiles ?? []) as Omit<MemberRow, "coachStatus">[]).map((p) => ({
    ...p,
    coachStatus: coachStatus.get(p.id) ?? null,
  }));

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
        <header className="flex items-center gap-4">
          <Link href="/" aria-label="Back" className="text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>

        <main className="mt-7 md:mt-10">
          <Eyebrow>Admin · Members</Eyebrow>
          {/* Mobile keeps just the eyebrow — the directory is the page. */}
          <h1 className="mt-4 hidden text-[34px] leading-[1.1] font-black tracking-[-0.02em] text-cream md:block">
            Everyone who&apos;s joined as a member.
          </h1>
          <p className="mt-3 hidden max-w-[560px] text-[15px] leading-[1.5] text-secondary md:block">
            Only admins see this page. Open a member to review their full profile and approve them.
          </p>

          <MembersDirectory members={members} />
        </main>
      </div>
    </PageFrame>
  );
}
