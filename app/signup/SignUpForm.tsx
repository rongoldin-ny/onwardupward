"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";
import { Cta, Logo, PageFrame } from "@/components/ui";

export default function SignUpForm({ greetingText }: { greetingText: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, {});
  const [show, setShow] = useState(false);

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
      <header>
        <Logo />
      </header>

      <main className="mt-[30%]">
        <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
          Create an account.
        </h1>
        <p className="mt-3 text-[17px] text-secondary">{`${greetingText} — let's get you set up.`}</p>

        <form className="mt-9" action={formAction}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            className="h-[58px] w-full rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
          />
          <div className="relative mt-4">
            <input
              type={show ? "text" : "password"}
              name="password"
              placeholder="Password"
              autoComplete="new-password"
              className="h-[58px] w-full rounded-full border border-border-1 bg-surface-2 px-6 pr-20 text-[15px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-1/2 right-6 -translate-y-1/2 text-[15px] text-muted"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {state.error && <p className="mt-4 text-[14px] text-gold">{state.error}</p>}
          {state.notice && (
            <p className="mt-4 rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
              {state.notice}
            </p>
          )}
          <Cta type="submit" className="mt-7" disabled={pending}>
            {pending ? "One moment…" : "Continue"}
          </Cta>
        </form>
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
