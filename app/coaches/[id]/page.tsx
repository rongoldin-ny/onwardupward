import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import { currentUser } from "@/lib/auth";
import {
  CLAIM_MAILTO,
  coachLevels,
  disciplineLabel,
  type CoachRow,
} from "@/lib/coach-shared";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CtaLink, Eyebrow, PageFrame, Tag } from "@/components/ui";

/**
 * Full-screen coach detail, profile-style. Publicly shareable — the page
 * works signed out (with the join banner), just like candidate share links.
 */
export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = supabaseAdmin();
  const [{ data }, user] = await Promise.all([
    admin.from("coaches").select("*").eq("id", id).in("status", ["approved", "unclaimed"]).maybeSingle(),
    currentUser().catch(() => null),
  ]);
  if (!data) notFound();
  const coach = data as CoachRow;

  await admin.from("analytics_events").insert({
    user_id: user?.id ?? null,
    event_type: "coach_view",
    metadata: { coach: coach.full_name, kind: "detail" },
  });

  const approved = coach.status === "approved";
  const subtitle = [coach.company, disciplineLabel(coach.disciplines)].filter(Boolean).join(" · ");

  return (
    <div>
      {!user && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-gold-border bg-gold-tint px-6 py-4">
          <p className="text-[14px] font-bold text-gold">
            onward/upward — a growth network for product designers and PMs.
          </p>
          <Link
            href="/signup"
            className="gold-gradient cta-glow shrink-0 rounded-full px-5 py-2.5 text-[14px] font-bold text-on-gold"
          >
            Sign up to join the network
          </Link>
        </div>
      )}
      <PageFrame size="modal">
        <div className="flex flex-1 flex-col px-6 pt-6 pb-8 lg:px-10 lg:pb-10">
          {user && (
            <header className="flex justify-end">
              <Link
                href="/coaches"
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-2"
              >
                <X size={16} strokeWidth={1.5} className="text-secondary" />
              </Link>
            </header>
          )}

          <main className="mt-4 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-12">
            <div className="flex flex-col items-center text-center lg:sticky lg:top-8 lg:items-start lg:text-left">
              {coach.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coach.photo_url}
                  alt={coach.full_name}
                  className="avatar-halo h-[132px] w-[132px] rounded-full object-cover"
                />
              ) : (
                <span className="avatar-halo flex h-[132px] w-[132px] items-center justify-center rounded-full border border-border-2 bg-surface-2 text-[36px] font-black text-secondary">
                  {coach.full_name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
              )}
              <h1 className="mt-7 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
                {coach.full_name}
              </h1>
              {subtitle && <p className="mt-2 text-[15px] text-secondary">{subtitle}</p>}
              <span
                className={`eyebrow mt-4 rounded-full border px-3 py-1.5 ${
                  approved ? "border-gold-border text-gold" : "border-border-2 text-muted"
                }`}
              >
                {approved ? "Claimed" : "Unclaimed"}
              </span>
              {coachLevels(coach).length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-start">
                  {coachLevels(coach).map((l) => (
                    <Tag key={l}>{l}</Tag>
                  ))}
                </div>
              )}
              {coach.website && (
                <a
                  href={coach.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold"
                >
                  Website
                  <ArrowUpRight size={13} strokeWidth={2} />
                </a>
              )}
              <div className="mt-8 hidden w-full lg:block">
                {approved && coach.booking_url ? (
                  <a
                    href={coach.booking_url}
                    target={coach.booking_url.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                    className="gold-gradient cta-glow block rounded-full px-6 py-4 text-center text-[15px] font-bold text-on-gold"
                  >
                    Book a session
                  </a>
                ) : !approved ? (
                  <a
                    href={CLAIM_MAILTO}
                    className="block rounded-full border border-border-2 px-6 py-4 text-center text-[15px] font-bold text-cream"
                  >
                    This you? Claim your slot
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-9 space-y-4 lg:mt-0">
              {coach.short_description && (
                <Card>
                  <Eyebrow>About</Eyebrow>
                  <p className="mt-3 text-[15px] leading-[1.6] text-body">
                    {coach.short_description}
                  </p>
                </Card>
              )}
              {coach.offering && (
                <Card>
                  <Eyebrow>The offering</Eyebrow>
                  <p className="mt-3 text-[15px] leading-[1.6] text-body">{coach.offering}</p>
                </Card>
              )}
              {coach.best_for && (
                <Card highlighted>
                  <Eyebrow>Best for</Eyebrow>
                  <p className="mt-3 text-[15px] leading-[1.6] text-body">{coach.best_for}</p>
                </Card>
              )}
              {coach.pricing && (
                <Card>
                  <Eyebrow>Pricing</Eyebrow>
                  <p className="mt-3 text-[15px] leading-[1.6] text-body">{coach.pricing}</p>
                </Card>
              )}
            </div>
          </main>

          <footer className="mt-8 lg:hidden">
            {approved && coach.booking_url ? (
              <a
                href={coach.booking_url}
                target={coach.booking_url.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                className="gold-gradient cta-glow block rounded-full px-6 py-4 text-center text-[15px] font-bold text-on-gold"
              >
                Book a session
              </a>
            ) : !approved ? (
              <a
                href={CLAIM_MAILTO}
                className="block rounded-full border border-border-2 px-6 py-4 text-center text-[15px] font-bold text-cream"
              >
                This you? Claim your slot
              </a>
            ) : null}
            {!user && (
              <CtaLink href="/signup" className="mt-3">
                Join the network
              </CtaLink>
            )}
          </footer>
        </div>
      </PageFrame>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "onward/upward" };
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.full_name ? `${data.full_name} — coach on onward/upward` : "onward/upward",
  };
}
