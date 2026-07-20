import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { COACHES } from "@/lib/coaches";
import { Card, Eyebrow, Logo, PageFrame, Tag } from "@/components/ui";

export const metadata = { title: "Coaches — onward/upward" };

/**
 * Coach directory. Every listing is currently unclaimed — these coaches
 * haven't joined the network yet, so no direct contact routes are shown.
 */
export default async function CoachesPage() {
  await requireUser();

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

        <main className="mt-10">
          <Eyebrow>Train with the best</Eyebrow>
          <h1 className="mt-4 text-[34px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Coaches who&apos;ve made the climb.
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.5] text-secondary">
            A curated bench of design leadership and career coaches. Unclaimed
            profiles haven&apos;t joined the network yet — introductions open up
            once they do.
          </p>

          <div className="mt-9 grid gap-4 lg:grid-cols-2">
            {COACHES.map((coach) => (
              <Card key={coach.slug} className="flex flex-col">
                <div className="flex items-center gap-4">
                  {coach.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.photoUrl}
                      alt={coach.name}
                      className="h-[64px] w-[64px] shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full border border-border-2 bg-surface-2 text-[20px] font-black text-secondary">
                      {coach.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="truncate text-[19px] font-black tracking-[-0.02em] text-cream">
                        {coach.name}
                      </h2>
                      <span
                        className={`eyebrow shrink-0 rounded-full border px-3 py-1.5 ${
                          coach.status === "claimed"
                            ? "border-gold-border text-gold"
                            : "border-border-2 text-muted"
                        }`}
                      >
                        {coach.status === "claimed" ? "Claimed" : "Unclaimed"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-secondary">{coach.org}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-[14px] leading-[1.55] text-body-2">
                  {coach.bio}
                </p>
                <p className="mt-3 line-clamp-3 text-[13px] leading-[1.55] text-secondary">
                  {coach.offerings}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag>{coach.price}</Tag>
                </div>
                <p className="mt-4 border-t border-border-1 pt-3.5 text-[13px] leading-[1.5] text-secondary">
                  <span className="font-bold text-gold">Best for:</span> {coach.bestFor}
                </p>
                {coach.status === "claimed" && (
                  <a
                    href={coach.contact}
                    target="_blank"
                    rel="noreferrer"
                    className="gold-gradient cta-glow mt-4 rounded-full px-6 py-3 text-center text-[14px] font-bold text-on-gold"
                  >
                    Book a session
                  </a>
                )}
              </Card>
            ))}
          </div>

          <p className="mt-8 text-[12px] text-muted">
            Unclaimed coaches can&apos;t be contacted through onward/upward yet.
            Know one of them? Encourage them to claim their profile.
          </p>
        </main>
      </div>
    </PageFrame>
  );
}
