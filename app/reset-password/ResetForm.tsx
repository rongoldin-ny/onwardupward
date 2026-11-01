"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { PasswordField } from "@/components/AuthFields";
import { Cta } from "@/components/ui";

export default function ResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(updatePassword, {});

  return (
    <form action={formAction} className="mt-9 space-y-4 text-left">
      <PasswordField
        placeholder="New password (8+ characters)"
        aria-label="New password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state.error && <p className="text-[14px] text-gold">{state.error}</p>}
      <Cta type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </Cta>
    </form>
  );
}
