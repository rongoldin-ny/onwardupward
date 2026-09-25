import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import { Logo, PageFrame } from "@/components/ui";
import GoogleButton from "@/components/GoogleButton";

export default async function SignUpPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));

  return (
    <PageFrame size="narrow" chromeLogo={false} centered>
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8 text-center">
        <main className="flex flex-1 flex-col justify-center">
          {/* Centered as a unit: a bare flex item would stretch and left-align the lockup. */}
          <span className="self-center">
            <Logo />
          </span>

          <h1 className="mt-9 text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            Join the waitlist.
          </h1>
          <p className="mt-3 text-[17px] text-balance text-secondary">{`${greeting()} — tell us a little about you.`}</p>

          {/* Agreement by a clear notice right above the button, rather than a
              pre-ticked box: a box nobody ticks isn't consent, and courts read
              it as weaker notice than this. Clicking through is the agreement,
              so the button records it (see lib/terms.ts). */}
          <p className="mt-9 text-[13px] leading-[1.5] text-balance text-body-2">
            By joining, you agree to the{" "}
            <Link href="/terms" className="font-bold text-secondary underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold whitespace-nowrap text-secondary underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-4">
            <GoogleButton label="Join the waitlist with Google" accepted />
          </div>

          {/* Inside <main> so it sits with the form rather than pinned to the
              bottom edge, where mobile browser chrome cut it off. */}
          <p className="mt-10 text-[15px] text-secondary">
            Already a member?{" "}
            <Link href="/signin" className="font-bold">
              Sign in
            </Link>
          </p>
        </main>
      </div>
    </PageFrame>
  );
}
