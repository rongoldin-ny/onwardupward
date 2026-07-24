import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { coachAnalytics } from "@/lib/coach-analytics";
import { signOut } from "@/app/actions/auth";
import CoachAnalyticsTiles from "@/components/CoachAnalyticsTiles";
import CoachListingForm from "@/components/CoachListingForm";
import CoachWizard from "@/components/CoachWizard";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Coach — onward/upward" };

/** Coach home: onboarding (first save) and listing editing, one page. */
export default async function CoachHubPage() {
  const user = await requireUser();
  if (user.role !== "coach") redirect("/");
  const listing = await getCoachByProfileId(user.id);

  if (!listing) {
    return (
      <CoachWizard
        prefill={{ name: user.name, email: user.email, photoUrl: user.photo_url }}
        exitHref="/"
      />
    );
  }

  const analytics = await coachAnalytics(listing.id);

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header className="flex items-center justify-between">
          <span className="md:hidden"><Logo /></span>
          <form action={signOut} className="ml-auto">
            <button type="submit" className="text-[13px] text-muted">
              Sign out
            </button>
          </form>
        </header>

        <main className="mt-10">
          <Eyebrow>Coaching on onward/upward</Eyebrow>
          <h1 className="mt-4 text-[32px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {listing.status === "pending" ? "Under review." : "Your listing is live."}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-secondary">
            {listing.status === "pending"
              ? "We're reviewing your listing — you'll get an email the moment it's approved. Edits below are saved to your application."
              : "Members can find you in the coaches directory and book sessions through your link. Edits go live immediately."}
          </p>

          <div className="mt-8">
            <CoachAnalyticsTiles analytics={analytics} />
          </div>

          <div className="mt-9">
            <CoachListingForm
              existing={listing}
              prefill={{ name: user.name, email: user.email, photoUrl: user.photo_url }}
              submitLabel="Save changes"
            />
          </div>
        </main>
      </div>
    </PageFrame>
  );
}
