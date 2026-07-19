"use client";

import { useActionState, useState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { Cta, Logo, PageFrame } from "@/components/ui";

export default function ResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );
  const [show, setShow] = useState(false);

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <header>
          <Logo />
        </header>

        <main className="mt-[30%]">
          <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            Set a new password.
          </h1>

          <form className="mt-9" action={formAction}>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                name="password"
                placeholder="New password"
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
            <Cta type="submit" className="mt-7" disabled={pending}>
              {pending ? "Saving…" : "Save password"}
            </Cta>
          </form>
        </main>
      </div>
    </PageFrame>
  );
}
