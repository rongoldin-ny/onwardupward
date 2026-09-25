import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "You're on the list — onward/upward" };

/**
 * Where waitlisted members and coaches land, signed out. Straight after
 * onboarding (?joined=1) it confirms the sign-up; when they sign in again
 * before being let in (?listed=1, via /auth/waitlisted) it reminds them where
 * they stand; if they were turned down (?rejected=member|coach) it says so, gently.
 */
export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // homeFor() routes a still-signed-in waitlister through /auth/waitlisted.
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  const { joined, listed, rejected } = await searchParams;
  if (!joined && !listed && !rejected) redirect("/");

  return (
    <PageFrame size="narrow" chromeLogo={false} centered>
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8 text-center">
        <main className="flex flex-1 flex-col justify-center">
          {/* Centered as a unit: a bare flex item would stretch and left-align the lockup. */}
          <span className="self-center">
            <Logo />
          </span>

          {rejected ? (
            <>
              <h1 className="mt-9 text-[28px] leading-[1.12] font-black tracking-[-0.02em] text-balance text-cream">
                {rejected === "coach"
                  ? "Looks like you've already applied to coach with us."
                  : "Looks like you've already tried joining our waitlist."}
              </h1>
              <p className="mt-3 text-[17px] text-balance text-secondary">
                <a href="mailto:hello@onwardupward.io" className="font-bold text-gold">
                  Contact us
                </a>{" "}
                if you have any questions.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-9 text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
                {joined ? "Got it!" : "You're on the list!"}
              </h1>
              <p className="mt-3 text-[17px] text-balance text-secondary">
                You&apos;ll get notified by email when you&apos;re in.
              </p>
            </>
          )}
        </main>
      </div>
    </PageFrame>
  );
}
