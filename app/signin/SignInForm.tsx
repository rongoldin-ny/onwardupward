"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";
import { PasswordField } from "@/components/AuthFields";
import { TextField } from "@/components/fields";
import { Cta } from "@/components/ui";

export default function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        type="email"
        name="email"
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        required
      />
      <PasswordField
        placeholder="Password"
        aria-label="Password"
        autoComplete="current-password"
        required
      />
      {state.error && <p className="text-[14px] text-gold">{state.error}</p>}
      <p className="text-right text-[14px]">
        <Link href="/forgot-password" className="text-secondary">
          Forgot password?
        </Link>
      </p>
      <Cta type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Cta>
    </form>
  );
}
