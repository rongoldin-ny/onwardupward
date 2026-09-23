import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getReviewCounts } from "@/lib/coach-reviews-db";
import { getCoachMatches } from "@/lib/coach-match";
import { publicCoach } from "@/lib/coach-shared";
import { getDirectoryCoaches } from "@/lib/coaches-db";
import { isVetter } from "@/lib/vetting";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";
import CoachesDirectory from "./CoachesDirectory";

export const metadata = { title: "Coaches — onward/upward" };

/**
 * Coach directory with search + smart filters. Members see claimed coaches
 * only; admins also see the unclaimed listings, which show no contact routes.
 */
export default async function CoachesPage() {
  const user = await requireUser();
  const admin = isVetter(user);
  const coaches = await getDirectoryCoaches({ includeUnclaimed: admin });
  // Not awaited: the directory renders right away and the match badges and
  // ordering stream in once Claude has read the member's profile.
  const matches = user.role === "candidate" ? getCoachMatches(user, coaches) : null;
  const reviewCounts = await getReviewCounts(coaches.map((c) => c.id));

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
          <Eyebrow>Train with the best</Eyebrow>
          {/* Mobile keeps just the eyebrow — the directory is the page. */}
          <h1 className="mt-4 hidden text-[34px] leading-[1.1] font-black tracking-[-0.02em] text-cream md:block">
            Coaches and mentors who&apos;ve made the climb.
          </h1>
          <p className="mt-3 hidden max-w-[560px] text-[15px] leading-[1.5] text-secondary md:block">
            A curated bench of design and product leadership coaches.
          </p>

          <CoachesDirectory coaches={coaches.map(publicCoach)} matches={matches} reviewCounts={reviewCounts} />

          {admin && (
            <p className="mt-8 text-[12px] text-muted">
              Unclaimed listings are visible to admins only until their coach
              claims them.
            </p>
          )}
        </main>
      </div>
    </PageFrame>
  );
}
