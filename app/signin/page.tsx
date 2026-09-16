import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import GoogleButton from "@/components/GoogleButton";
import { Logo, PageFrame } from "@/components/ui";

const errors: Record<string, string> = {
  "google-cancelled": "You cancelled the Google sign-in — try again when you're ready.",
  google: "We couldn't complete that sign-in. Try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { error, next } = await searchParams;

  const user = await currentUser();
  if (user) {
    redirect(next?.startsWith("/") && user.onboarding_complete ? next : homeFor(user));
  }

  return (
    <PageFrame size="narrow" chromeLogo={false} centered>
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8 text-center">
        <main className="flex flex-1 flex-col justify-center">
          {/* Centered as a unit: a bare flex item would stretch and left-align the lockup. */}
          <span className="self-center">
            <Logo />
          </span>

          <h1 className="mt-9 text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            Welcome back.
          </h1>
          <p className="mt-3 text-[17px] text-secondary">
            {greeting()} — sign in to continue.
          </p>

          {error && (
            <p className="mt-7 rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
              {errors[error] ?? errors.google}
            </p>
          )}

          <div className="mt-9">
            <GoogleButton next={next?.startsWith("/") ? next : undefined} />
          </div>

          <p className="mt-5 text-[13px] leading-[1.5] text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms" className="text-secondary">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-secondary">
              Privacy Policy
            </Link>
            .
          </p>

          {/* Inside <main> so it sits with the form rather than pinned to the
              bottom edge, where mobile browser chrome cut it off. */}
          <p className="mt-10 text-[15px] text-secondary">
            New here?{" "}
            <Link href="/signup" className="font-bold">
              Create an account
            </Link>
          </p>
        </main>
      </div>
    </PageFrame>
  );
}
