import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { approveCoach, rejectCoach } from "@/app/actions/coaches";
import { approveClaim, rejectClaim } from "@/app/actions/claims";
import { approveCandidate, rejectCandidate } from "@/app/admin/vetting/[id]/actions";
import { getPendingClaims, getPendingCoaches } from "@/lib/coaches-db";
import type { Profile } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/server";
import { labelForRoleType } from "@/lib/taxonomy";
import { requireVetter } from "@/lib/vetting";
import { Avatar, Eyebrow, Logo, PageFrame, Tag } from "@/components/ui";
import ReviewActions from "@/components/admin/ReviewActions";
import AdminTabs from "../AdminTabs";
import { letInFromWaitlist, rejectFromWaitlist } from "./actions";

export const metadata = { title: "Waitlist — onward/upward" };

/** The approval queue: pending members, pending coaches, and coach claims — one place. */
export default async function WaitlistPage() {
  await requireVetter();

  const [{ data: memberRows }, pendingCoaches, pendingClaims, { data: waitingCoachRows }] = await Promise.all([
    supabaseAdmin()
      .from("profiles")
      .select("*")
      .eq("role", "candidate")
      .eq("onboarding_complete", true)
      .eq("vetting_status", "pending")
      .order("updated_at", { ascending: false }),
    getPendingCoaches(),
    getPendingClaims(),
    supabaseAdmin()
      .from("profiles")
      .select("*")
      .eq("role", "coach")
      .not("waitlisted_at", "is", null)
      .neq("vetting_status", "rejected")
      .order("waitlisted_at", { ascending: false }),
  ]);
  const members = (memberRows ?? []) as Profile[];
  // Waitlisted coaches with a submitted card are let in by approving it above;
  // these skipped the coaching step, so there's nothing to approve but them.
  const submitted = new Set(pendingCoaches.map((c) => c.profile_id));
  const waitingCoaches = ((waitingCoachRows ?? []) as Profile[]).filter((p) => !submitted.has(p.id));
  const total = members.length + pendingCoaches.length + pendingClaims.length + waitingCoaches.length;

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>
        <main className="mx-auto w-full max-w-[640px] lg:max-w-none">
          <AdminTabs />
          <h1 className="mt-8 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {total === 0 ? "Queue's clear." : `${total} waiting.`}
          </h1>

          <Eyebrow className="mt-8">Claims ({pendingClaims.length})</Eyebrow>
          <div className="mt-3 space-y-3">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="rounded-[20px] border border-border-1 bg-surface-2 p-5">
                <p className="eyebrow text-muted">Coach card says</p>
                <div className="mt-2 flex items-center gap-3.5">
                  {claim.coach.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={claim.coach.photo_url}
                      alt=""
                      className="h-[40px] w-[40px] shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-[13px] font-black text-secondary">
                      {claim.coach.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-cream">{claim.coach.full_name}</p>
                    <p className="truncate text-[12.5px] text-secondary">
                      {claim.coach.email ?? "No email on file"}
                    </p>
                  </div>
                  <Link
                    href={`/coaches/${claim.coach.id}`}
                    className="shrink-0 text-[12px] font-bold text-gold"
                  >
                    View listing
                  </Link>
                </div>

                <p className="eyebrow mt-4 text-muted">Claimed by</p>
                <div className="mt-2 flex items-center gap-3.5">
                  <Avatar id={claim.profile.id} src={claim.profile.photo_url} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-cream">
                      {claim.profile.name ?? "Unnamed"}
                    </p>
                    <p
                      className={`truncate text-[12.5px] ${
                        claim.coach.email && claim.profile.email === claim.coach.email
                          ? "font-bold text-success"
                          : "text-secondary"
                      }`}
                    >
                      {claim.profile.email ?? "No email on file"}
                      {claim.coach.email && claim.profile.email === claim.coach.email && " · matches"}
                    </p>
                  </div>
                  <Link
                    href={`/candidate/${claim.profile.id}`}
                    className="shrink-0 text-[12px] font-bold text-gold"
                  >
                    View profile
                  </Link>
                </div>

                <ReviewActions
                  approveAction={approveClaim.bind(null, claim.id)}
                  rejectAction={rejectClaim.bind(null, claim.id)}
                  approveLabel="Approve claim"
                />
              </div>
            ))}
            {pendingClaims.length === 0 && (
              <p className="rounded-[16px] border border-dashed border-border-2 px-5 py-5 text-center text-[13px] text-secondary">
                No claims waiting.
              </p>
            )}
          </div>

          <Eyebrow className="mt-9">Members ({members.length})</Eyebrow>
          <div className="mt-3 space-y-3">
            {members.map((p) => (
              <div key={p.id} className="rounded-[20px] border border-border-1 bg-surface-2 p-4">
                <div className="flex items-center gap-4">
                  <Avatar id={p.id} src={p.photo_url} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-cream">
                      {p.name ?? p.email ?? "Unnamed"}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-secondary">
                      {labelForRoleType(p.role_type)}
                      {p.location_city ? ` · ${p.location_city}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/admin/vetting/${p.id}`}
                    aria-label="View full profile"
                    className="shrink-0 text-gold"
                  >
                    <ArrowRight size={17} strokeWidth={1.5} />
                  </Link>
                </div>
                <ReviewActions
                  approveAction={approveCandidate.bind(null, p.id)}
                  rejectAction={rejectCandidate.bind(null, p.id)}
                />
              </div>
            ))}
            {members.length === 0 && (
              <p className="rounded-[16px] border border-dashed border-border-2 px-5 py-5 text-center text-[13px] text-secondary">
                No member applications waiting.
              </p>
            )}
          </div>

          <Eyebrow className="mt-9">Coaches ({pendingCoaches.length})</Eyebrow>
          <div className="mt-3 space-y-3">
            {pendingCoaches.map((coach) => (
              <div
                key={coach.id}
                className="rounded-[20px] border border-border-1 bg-surface-2 p-5"
              >
                <div className="flex items-center gap-4">
                  {coach.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.photo_url}
                      alt=""
                      className="h-[48px] w-[48px] shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-[15px] font-black text-secondary">
                      {coach.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-cream">{coach.full_name}</p>
                    <p className="mt-0.5 truncate text-[13px] text-secondary">
                      {coach.email}
                      {coach.company ? ` · ${coach.company}` : ""}
                    </p>
                  </div>
                </div>
                {coach.short_description && (
                  <p className="mt-3.5 text-[13.5px] leading-[1.55] text-body-2">
                    {coach.short_description}
                  </p>
                )}
                {coach.offering && (
                  <p className="mt-2 text-[13px] leading-[1.55] text-secondary">{coach.offering}</p>
                )}
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {coach.target_mentees.map((m) => (
                    <Tag key={m}>{m}</Tag>
                  ))}
                  {coach.pricing && <Tag>{coach.pricing}</Tag>}
                </div>
                {coach.best_for && (
                  <p className="mt-3 text-[13px] text-secondary">
                    <span className="font-bold text-gold">Best for:</span> {coach.best_for}
                  </p>
                )}
                <p className="mt-2 truncate text-[12px] text-muted">
                  Booking: {coach.booking_url}
                  {coach.website ? ` · ${coach.website}` : ""}
                </p>
                <ReviewActions
                  approveAction={approveCoach.bind(null, coach.id)}
                  rejectAction={rejectCoach.bind(null, coach.id)}
                  approveLabel="Approve — live & bookable"
                />
              </div>
            ))}
            {pendingCoaches.length === 0 && (
              <p className="rounded-[16px] border border-dashed border-border-2 px-5 py-5 text-center text-[13px] text-secondary">
                No coach applications waiting.
              </p>
            )}
          </div>

          {waitingCoaches.length > 0 && (
            <>
              <Eyebrow className="mt-9">Coaches without a card ({waitingCoaches.length})</Eyebrow>
              <div className="mt-3 space-y-3">
                {waitingCoaches.map((p) => (
                  <div key={p.id} className="rounded-[20px] border border-border-1 bg-surface-2 p-4">
                    <div className="flex items-center gap-4">
                      <Avatar id={p.id} src={p.photo_url} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-bold text-cream">
                          {p.name ?? p.email ?? "Unnamed"}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-secondary">
                          {p.email ?? "No email on file"}
                        </p>
                      </div>
                      <Link
                        href={`/admin/vetting/${p.id}`}
                        aria-label="View full profile"
                        className="shrink-0 text-gold"
                      >
                        <ArrowRight size={17} strokeWidth={1.5} />
                      </Link>
                    </div>
                    <ReviewActions
                      approveAction={letInFromWaitlist.bind(null, p.id)}
                      rejectAction={rejectFromWaitlist.bind(null, p.id)}
                      approveLabel="Let in"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </PageFrame>
  );
}
