import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { coachMissing } from "@/lib/coach-shared";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { coachAnalytics } from "@/lib/coach-analytics";
import { signOut } from "@/app/actions/auth";
import CoachAnalyticsTiles from "@/components/CoachAnalyticsTiles";
import FlashToast from "@/components/FlashToast";
import { CtaLink, Eyebrow, Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Coach — onward/upward" };

/** Coach home: listing status and analytics; editing lives on the profile. */
export default async function CoachHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { welcome } = await searchParams;
  const user = await requireUser();
  if (user.role !== "coach") redirect("/");
  const listing = await getCoachByProfileId(user.id);
  if (!listing) redirect("/profile?side=coach");

  const analytics = await coachAnalytics(listing.id);
  const missing = coachMissing(listing);

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header className="flex items-center justify-between">
          <span className="md:hidden"><Logo full /></span>
          <form action={signOut} className="ml-auto">
            <button type="submit" className="text-[13px] text-muted">
              Sign out
            </button>
          </form>
        </header>

        <main className="mt-10">
          {/* Landing here straight from a claim — no role picker, no wizard. */}
          {welcome === "coach" && (
            <div className="mb-7">
              <FlashToast message="You're in! Check your coaching profile and refine it as you like." />
            </div>
          )}
          <Eyebrow>Coaching on onward/upward</Eyebrow>
          <h1 className="mt-4 text-[32px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {listing.status === "draft"
              ? "Finish your coaching card."
              : listing.status === "pending"
                ? "Under review."
                : "Your listing is live."}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-secondary">
            {listing.status === "draft"
              ? "Your coaching card is saved as a draft. Submit it for review from your profile when it's ready."
              : listing.status === "pending"
                ? "We're reviewing your listing — you'll get an email the moment it's approved. Edits on your profile are saved to your application."
                : "Members can find you in the coaches directory and book sessions through your link. Edits on your profile go live immediately."}
          </p>

          {/* The one thing to do next, above the numbers: a listing missing
              these is a listing members can't be matched to. */}
          {missing.length > 0 && (
            <Link
              href="/profile?side=coach"
              className="gold-gradient cta-glow mt-8 block rounded-[20px] p-5 text-on-gold"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-black tracking-[-0.02em]">
                  Complete your coaching profile
                </h2>
                <ArrowRight size={18} strokeWidth={2} className="shrink-0" />
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-on-gold/75">
                {`Add ${missing.map((m) => m.toLowerCase()).join(", ")} so members can be matched to you.`}
              </p>
            </Link>
          )}

          <div className="mt-8">
            <CoachAnalyticsTiles analytics={analytics} />
          </div>

          <div className="mt-9 space-y-3">
            <CtaLink href="/profile?side=coach">Edit your profile</CtaLink>
            <CtaLink href="/coaches" variant="secondary">
              Browse the coach directory
            </CtaLink>
          </div>
        </main>
      </div>
    </PageFrame>
  );
}
