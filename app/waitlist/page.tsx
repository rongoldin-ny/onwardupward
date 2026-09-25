import { redirect } from "next/navigation";
import { currentUser, homeFor, onWaitlist } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "You're on the list — onward/upward" };

/**
 * Where waitlisted members and coaches wait to be let in. Straight after
 * onboarding (?joined=1) it confirms the sign-up; on any later visit it
 * reminds them where they stand.
 */
export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (!onWaitlist(user)) redirect(homeFor(user));
  const { joined } = await searchParams;

  return (
    <PageFrame size="narrow" chromeLogo={false} centered>
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8 text-center">
        <main className="flex flex-1 flex-col justify-center">
          {/* Centered as a unit: a bare flex item would stretch and left-align the lockup. */}
          <span className="self-center">
            <Logo />
          </span>

          <h1 className="mt-9 text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            {joined ? "Got it!" : "You're on the list!"}
          </h1>
          <p className="mt-3 text-[17px] text-balance text-secondary">
            You&apos;ll get notified by email when you&apos;re in.
          </p>

          <form action={signOut} className="mt-10">
            <button type="submit" className="text-[15px] font-bold text-secondary">
              Sign out
            </button>
          </form>
        </main>
      </div>
    </PageFrame>
  );
}
