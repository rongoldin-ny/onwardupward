import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCandidate } from "@/lib/auth";
import { getCoachByProfileId, getDirectoryCoaches, type CoachRow } from "@/lib/coaches-db";
import { getMentorshipPosts } from "@/lib/mentorship-posts";
import { missingRequired, profileCompletionPct } from "@/lib/stats";
import { greeting } from "@/lib/greeting";
import { Card, CtaLink, Eyebrow, Logo, PageFrame } from "@/components/ui";
import GrowthGoalCard from "./GrowthGoalCard";

const RECOMMENDED_COACH_SLUGS = ["andy-polaine", "mia-blume", "judd-garratt"];

export default async function Dashboard() {
  const user = await requireCandidate();
  const [posts, mentorListing] = await Promise.all([
    getMentorshipPosts(),
    getCoachByProfileId(user.id),
  ]);
  const firstName = (user.name ?? "there").split(" ")[0];
  const completionPct = profileCompletionPct(user);
  const missing = missingRequired(user);
  const directory = await getDirectoryCoaches();
  const coaches = RECOMMENDED_COACH_SLUGS.map((s) => directory.find((c) => c.slug === s))
    .filter(Boolean)
    .slice(0, 3) as CoachRow[];

  return (
    <PageFrame size="wide">
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8 lg:px-10 lg:pb-10">
      <header className="md:hidden">
        <Logo />
      </header>

      <h1 className="mt-10 text-[38px] leading-[1.15] font-black tracking-[-0.02em] text-cream md:mt-0">
        {greeting()},<br />
        <span className="text-secondary">{firstName}.</span>
      </h1>

      <main className="mt-9 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10">
        <div>
          {completionPct < 100 && (
            <Link href="/profile" className="mb-4 block">
              <Card highlighted>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                    {completionPct}% complete — finish your profile
                  </h2>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <p className="mt-1.5 text-[13px] text-secondary">
                  {missing.length > 0
                    ? `Add ${missing.join(", ")} to make your profile visible.`
                    : "Review and add detail to get discovered."}
                </p>
                <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full bg-border-1">
                  <div
                    className="h-full gold-gradient rounded-full"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </Card>
            </Link>
          )}

          <GrowthGoalCard goal={user.growth_goal} />

          {!mentorListing ? (
            <Link href="/profile?side=coach" className="mt-4 block">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                    Open to mentoring other designers and PMs?
                  </h2>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
                  Join the coach bench — share what you know, on your terms.
                </p>
              </Card>
            </Link>
          ) : (
            <Link href="/settings/coaching-analytics" className="mt-4 block">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                    Your coaching stats
                  </h2>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
                  Impressions, views, and requests on your coach listing.
                </p>
              </Card>
            </Link>
          )}

          <CtaLink href="/profile" variant="secondary" className="mt-4">
            My profile
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
                href={`/coaches/${coach.id}`}
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
