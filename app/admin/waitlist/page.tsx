import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { approveCoach } from "@/app/actions/coaches";
import { getPendingCoaches } from "@/lib/coaches-db";
import { disciplineLabel } from "@/lib/coach-shared";
import type { Profile } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/server";
import { labelForRoleType } from "@/lib/taxonomy";
import { requireVetter } from "@/lib/vetting";
import { Avatar, Cta, Eyebrow, Logo, PageFrame, Tag } from "@/components/ui";
import AdminTabs from "../AdminTabs";

export const metadata = { title: "Waitlist — onward/upward" };

/** The approval queue: pending members and pending coaches, one place. */
export default async function WaitlistPage() {
  await requireVetter();

  const [{ data: memberRows }, pendingCoaches] = await Promise.all([
    supabaseAdmin()
      .from("profiles")
      .select("*")
      .eq("role", "candidate")
      .eq("onboarding_complete", true)
      .eq("vetting_status", "pending")
      .order("updated_at", { ascending: false }),
    getPendingCoaches(),
  ]);
  const members = (memberRows ?? []) as Profile[];

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>
        <main>
          <AdminTabs />
          <h1 className="mt-8 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {members.length + pendingCoaches.length === 0
              ? "Queue's clear."
              : `${members.length + pendingCoaches.length} waiting.`}
          </h1>

          <Eyebrow className="mt-8">Members ({members.length})</Eyebrow>
          <div className="mt-3 space-y-3">
            {members.map((p) => (
              <Link
                key={p.id}
                href={`/admin/vetting/${p.id}`}
                className="flex items-center gap-4 rounded-[20px] border border-border-1 bg-surface-2 p-4"
              >
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
                <ArrowRight size={17} strokeWidth={1.5} className="shrink-0 text-gold" />
              </Link>
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
                      {coach.disciplines ? ` · ${disciplineLabel(coach.disciplines)}` : ""}
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
                <form action={approveCoach.bind(null, coach.id)} className="mt-4">
                  <Cta type="submit" className="!h-[46px] text-[14px]">
                    Approve — live &amp; bookable
                  </Cta>
                </form>
              </div>
            ))}
            {pendingCoaches.length === 0 && (
              <p className="rounded-[16px] border border-dashed border-border-2 px-5 py-5 text-center text-[13px] text-secondary">
                No coach applications waiting.
              </p>
            )}
          </div>
        </main>
      </div>
    </PageFrame>
  );
}
