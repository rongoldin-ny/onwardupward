"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";
import { Cta, Logo, PageFrame } from "@/components/ui";

export default function ForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>

        <main className="mt-[30%]">
          <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            Forgot your password?
          </h1>
          <p className="mt-3 text-[17px] text-secondary">
            We&apos;ll email you a link to set a new one.
          </p>

          <form className="mt-9" action={formAction}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              className="h-[58px] w-full rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
            />
            {state.error && <p className="mt-4 text-[14px] text-gold">{state.error}</p>}
            {state.notice && (
              <p className="mt-4 rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
                {state.notice}
              </p>
            )}
            <Cta type="submit" className="mt-7" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Cta>
          </form>
        </main>

        <footer className="mt-auto pt-10 text-center text-[15px] text-secondary">
          Remembered it?{" "}
          <Link href="/signin" className="font-bold">
            Sign in
          </Link>
        </footer>
      </div>
    </PageFrame>
  );
}
