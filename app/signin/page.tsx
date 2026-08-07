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
  const user = await currentUser();
  if (user) redirect(homeFor(user));

  const { error, next } = await searchParams;

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <header>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>

        <main className="mt-[30%]">
          <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
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

          <p className="mt-5 text-center text-[13px] leading-[1.5] text-muted">
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
        </main>

        <footer className="mt-auto pt-10 text-center text-[15px] text-secondary">
          New here?{" "}
          <Link href="/signup" className="font-bold">
            Create an account
          </Link>
        </footer>
      </div>
    </PageFrame>
  );
}
