"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";
import { AuthNotice, PasswordField } from "@/components/AuthFields";
import { TextField } from "@/components/fields";
import { Cta } from "@/components/ui";

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, {});

  if (state.notice) return <AuthNotice>{state.notice}</AuthNotice>;

  return (
    <form action={formAction} className="space-y-4 text-left">
      <TextField name="name" placeholder="Full name" aria-label="Full name" autoComplete="name" required />
      <TextField
        type="email"
        name="email"
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        required
      />
      <PasswordField
        placeholder="Password (8+ characters)"
        aria-label="Password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state.error && <p className="text-[14px] text-gold">{state.error}</p>}
      <Cta type="submit" disabled={pending}>
        {pending ? "Joining…" : "Join the waitlist"}
      </Cta>
    </form>
  );
}
