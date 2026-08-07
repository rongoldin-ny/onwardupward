import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import GoogleButton from "@/components/GoogleButton";
import { Logo, PageFrame } from "@/components/ui";

export default async function SignUpPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));

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
            Create an account.
          </h1>
          <p className="mt-3 text-[17px] text-secondary">{`${greeting()} — let's get you set up.`}</p>

          <div className="mt-9">
            <GoogleButton label="Sign up with Google" />
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
          Already a member?{" "}
          <Link href="/signin" className="font-bold">
            Sign in
          </Link>
        </footer>
      </div>
    </PageFrame>
  );
}
