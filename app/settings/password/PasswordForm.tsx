"use client";

import { useActionState, useState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { Cta } from "@/components/ui";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
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
      <p className="mt-4 text-[13px] text-secondary">
        At least 8 characters. You&apos;ll stay signed in on this device.
      </p>
      {state.error && <p className="mt-4 text-[14px] text-gold">{state.error}</p>}
      <div className="mt-auto pt-10">
        <Cta type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Cta>
      </div>
    </form>
  );
}
