import Link from "next/link";
import { Logo, PageFrame } from "@/components/ui";
import ForgotForm from "./ForgotForm";

export const metadata = { title: "Reset your password — onward/upward" };

export default function ForgotPasswordPage() {
  return (
    <PageFrame size="narrow" chromeLogo={false} centered>
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8 text-center">
        <main className="flex flex-1 flex-col justify-center">
          <span className="self-center">
            <Logo />
          </span>

          <h1 className="mt-9 text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            Forgot your password?
          </h1>
          <p className="mt-3 text-[17px] text-balance text-secondary">
            We&apos;ll email you a link to set a new one.
          </p>

          <ForgotForm />

          <p className="mt-10 text-[15px] text-secondary">
            Remembered it?{" "}
            <Link href="/signin" className="font-bold">
              Sign in
            </Link>
          </p>
        </main>
      </div>
    </PageFrame>
  );
}
