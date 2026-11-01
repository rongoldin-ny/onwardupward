"use client";

import { useState, type ComponentProps } from "react";
import { TextField } from "@/components/fields";

/** A password input with a Show/Hide toggle. */
export function PasswordField(props: ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextField name="password" type={show ? "text" : "password"} className="pr-20" {...props} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute top-1/2 right-6 -translate-y-1/2 text-[15px] text-muted"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

/** Between the Google button and the email form. */
export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-[13px] text-muted" aria-hidden>
      <span className="h-px flex-1 bg-border-1" />
      or
      <span className="h-px flex-1 bg-border-1" />
    </div>
  );
}

/** The confirmation that stands in for a form once it has done its job. */
export function AuthNotice({ children }: { children: string }) {
  return (
    <p className="mt-7 rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
      {children}
    </p>
  );
}
