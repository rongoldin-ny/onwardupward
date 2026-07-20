import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVetter } from "@/lib/vetting";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db";
import { toCandidateView } from "@/lib/candidate-view";
import CandidateProfileView from "@/components/CandidateProfileView";
import { approveCandidate } from "./actions";
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
    .eq("role", "candidate")
    .maybeSingle();
  if (!data) notFound();
  const profile = data as Profile;
  const approved = profile.vetting_status === "approved";
  const approve = approveCandidate.bind(null, profile.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-1 bg-surface-1 px-6 py-4">
        <div>
          <p className="text-[15px] font-bold text-cream">
            {profile.name ?? profile.email ?? "Unnamed"}{" "}
            <span className={`eyebrow ml-2 ${approved ? "text-success" : "text-gold"}`}>
              {approved ? "Approved" : "Pending review"}
            </span>
          </p>
          <p className="mt-0.5 text-[12px] text-secondary">{profile.email}</p>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin/vetting" className="text-[13px] font-bold text-gold">
            Back to queue
          </Link>
          {!approved && (
            <form action={approve}>
              <Cta type="submit" className="!h-[44px] px-7 text-[14px]">
                Accept into the network
              </Cta>
            </form>
          )}
        </div>
      </div>
      <CandidateProfileView
        candidate={await toCandidateView(profile, { admin: true })}
        mode="public"
      />
    </div>
  );
}
