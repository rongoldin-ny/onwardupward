import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import { Logo, PageFrame } from "@/components/ui";
import SignUpConsent from "./SignUpConsent";

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
            Create an account.
          </h1>
          <p className="mt-3 text-[17px] text-secondary">{`${greeting()} — let's get you set up.`}</p>

          <div className="mt-9">
            <SignUpConsent />
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
