import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCandidate } from "@/lib/auth";
import { getCoachByProfileId, getDirectoryCoaches, type CoachRow } from "@/lib/coaches-db";
import { getMentorshipPosts } from "@/lib/mentorship-posts";
import { candidateStats, profileIncomplete } from "@/lib/stats";
import { greeting } from "@/lib/greeting";
import DashboardMenu from "./DashboardMenu";
import {
  Avatar,
  Card,
  CtaLink,
  Eyebrow,
  FixedChrome,
  Logo,
  PageFrame,
} from "@/components/ui";

const RECOMMENDED_COACH_SLUGS = ["andy-polaine", "mia-blume", "judd-garratt"];

export default async function Dashboard() {
  const user = await requireCandidate();
  const [stats, posts, mentorListing] = await Promise.all([
    candidateStats(user.id),
    getMentorshipPosts(),
    getCoachByProfileId(user.id),
  ]);
  const firstName = (user.name ?? "there").split(" ")[0];
  const incomplete = profileIncomplete(user);
  const isVetter =
    user.role === "admin" || (user.email ?? "").toLowerCase() === "r@rongoldin.com";
  const directory = await getDirectoryCoaches();
  const coaches = RECOMMENDED_COACH_SLUGS.map((s) => directory.find((c) => c.slug === s))
    .filter(Boolean)
    .slice(0, 3) as CoachRow[];

  return (
    <PageFrame size="wide">
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8 lg:px-10 lg:pb-10">
      {/* Mobile: logo + controls in the card header. Desktop: controls live
          in the fixed browser chrome, level with the top-left logo. */}
      <header className="flex items-center justify-between md:hidden">
        <Logo />
        <div className="ml-auto flex items-center gap-3">
          <Link href="/settings" aria-label="Settings">
            <Avatar id={user.id} src={user.photo_url} size={40} />
          </Link>
          <DashboardMenu isVetter={isVetter} />
        </div>
      </header>
      <FixedChrome>
        <Link href="/settings" aria-label="Settings">
          <Avatar id={user.id} src={user.photo_url} size={40} />
        </Link>
        <DashboardMenu isVetter={isVetter} />
      </FixedChrome>

      <h1 className="mt-10 text-[38px] leading-[1.15] font-black tracking-[-0.02em] text-cream md:mt-0">
        {greeting()},<br />
        <span className="text-secondary">{firstName}.</span>
      </h1>

      <main className="mt-9 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10">
        <div>
          <Card className="p-6">
            <Eyebrow>Your profile, this week</Eyebrow>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-[56px] leading-none font-black tracking-[-0.02em] text-cream">
                {stats.viewsThisWeek}
              </span>
              {stats.deltaPct !== null && (
                <span
                  className={`pb-1.5 text-[15px] font-bold ${
                    stats.deltaPct >= 0 ? "text-success" : "text-secondary"
                  }`}
                >
                  {stats.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(stats.deltaPct)}% vs last week
                </span>
              )}
            </div>
            <p className="mt-2 text-[15px] text-secondary">
              views · {stats.viewsToday} today
            </p>
            <hr className="my-5 border-border-1" />
            {stats.viewsThisWeek > 0 ? (
              <p className="text-[15px] text-body">
                You&apos;re in the{" "}
                <span className="font-bold text-gold">top {stats.topPct}%</span> of profiles
                this week.
              </p>
            ) : user.vetting_status === "pending" ? (
              <p className="text-[15px] text-secondary">
                Your profile is under review — we&apos;ll email you the moment
                you&apos;re in.
              </p>
            ) : (
              <p className="text-[15px] text-secondary">
                Your profile is live — views will show up here.
              </p>
            )}
          </Card>

          <CtaLink href="/profile/preview" variant="secondary" className="mt-4">
            Preview my profile
          </CtaLink>

          {posts.length > 0 && (
            <section className="mt-9">
              <Eyebrow>Today&apos;s mentorship reads</Eyebrow>
              <div className="mt-4 space-y-3">
                {posts.map((post) => (
                  <a
                    key={post.url}
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[20px] border border-border-1 bg-surface-2 p-5"
                  >
                    <p className="text-[15px] leading-[1.4] font-bold text-cream">
                      {post.title}
                    </p>
                    <p className="mt-1.5 text-[12px] text-secondary">
                      {post.publication} · Substack
                    </p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {!mentorListing && (
            <Link href="/settings/coaching" className="mt-4 block">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                    Open to mentoring other designers?
                  </h2>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
                  Join the coach bench — share what you know, on your terms.
                </p>
              </Card>
            </Link>
          )}

          {incomplete && (
            <Link href="/profile/edit" className="mt-4 block">
              <Card highlighted>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                    Finish your profile
                  </h2>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <p className="mt-1.5 text-[13px] text-secondary">
                  Add your portfolio to get discovered.
                </p>
              </Card>
            </Link>
          )}
        </div>

        <div className="mt-9 lg:relative lg:mt-0">
          {/* Floats above the column on lg so the first coach card top-aligns
              with the stats card across the grid. */}
          <span className="lg:absolute lg:-top-8">
            <Eyebrow>Recommended coaches</Eyebrow>
          </span>
          <div className="mt-4 space-y-3 lg:mt-0">
            {coaches.map((coach) => (
              <Link
                key={coach.id}
                href="/coaches"
                className="block rounded-[20px] border border-border-1 bg-surface-2 p-4"
              >
                <div className="flex items-center gap-3.5">
                  {coach.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.photo_url}
                      alt={coach.full_name}
                      className="h-[48px] w-[48px] shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-[15px] font-black text-secondary">
                      {coach.full_name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-cream">{coach.full_name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-secondary">{coach.company}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-[12px] leading-[1.5] text-secondary">
                  {coach.best_for}
                </p>
              </Link>
            ))}
            <Link href="/coaches" className="block pt-1 text-center text-[13px] font-bold text-gold">
              Browse all coaches →
            </Link>
          </div>
        </div>
      </main>

    </div>
    </PageFrame>
  );
}
