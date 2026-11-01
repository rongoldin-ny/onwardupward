"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";
import { AuthNotice } from "@/components/AuthFields";
import { TextField } from "@/components/fields";
import { Cta } from "@/components/ui";

export default function ForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.notice) return <AuthNotice>{state.notice}</AuthNotice>;

  return (
    <form action={formAction} className="mt-9 space-y-4 text-left">
      <TextField
        type="email"
        name="email"
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        required
      />
      {state.error && <p className="text-[14px] text-gold">{state.error}</p>}
      <Cta type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Cta>
    </form>
  );
}
