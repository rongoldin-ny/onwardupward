import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVetter } from "@/lib/vetting";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db";
import { toProfileView } from "@/lib/profile-view";
import ProfilePage from "@/components/profile/ProfilePage";
import { approveCandidate } from "./actions";
import { letInFromWaitlist } from "@/app/admin/waitlist/actions";
import { Cta } from "@/components/ui";

/** Review one application: full profile preview + the accept switch. */
export default async function VettingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireVetter();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .in("role", ["candidate", "coach"])
    .maybeSingle();
  if (!data) notFound();
  const profile = data as Profile;
  // Members are accepted through vetting; a waitlisted coach without a
  // submitted card is simply let in (their card is reviewed on its own later).
  const isCoach = profile.role === "coach";
  const approved = isCoach ? !profile.waitlisted_at : profile.vetting_status === "approved";
  const approve = isCoach
    ? letInFromWaitlist.bind(null, profile.id)
    : approveCandidate.bind(null, profile.id);

  return (
    <div>
      {/* Its own row below the site header — the fixed logo (top-left) and nav /
          mobile menu (top-right) sit over the page's first ~70px, which is
          where this bar used to be. Width matches the profile card below;
          the negative bottom margin trims PageFrame's top gap on desktop. */}
      <div className="mx-auto w-full max-w-[430px] pt-[76px] md:-mb-12 md:max-w-[1008px] md:px-6 md:pt-20">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-y border-border-1 bg-surface-1 px-6 py-4 sm:rounded-[20px] sm:border md:rounded-[24px]">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-cream">
              {profile.name ?? profile.email ?? "Unnamed"}{" "}
              <span className={`eyebrow ml-2 ${approved ? "text-success" : "text-gold"}`}>
                {approved
                  ? isCoach ? "Let in" : "Approved"
                  : profile.vetting_status === "rejected" ? "Rejected" : "Pending review"}
              </span>
            </p>
            <p className="mt-0.5 truncate text-[12px] text-secondary">{profile.email}</p>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/admin/vetting" className="text-[13px] font-bold whitespace-nowrap text-gold">
              Back to queue
            </Link>
            {!approved && (
              <form action={approve}>
                <Cta type="submit" className="!h-[44px] px-7 text-[14px] whitespace-nowrap">
                  {isCoach ? "Let in" : "Accept into the network"}
                </Cta>
              </form>
            )}
          </div>
        </div>
      </div>
      <ProfilePage
        view={await toProfileView(profile, { admin: true, isAdmin: true })}
        viewer="member"
        initialSide="player"
      />
    </div>
  );
}
