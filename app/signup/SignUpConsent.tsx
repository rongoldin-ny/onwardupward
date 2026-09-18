"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import GoogleButton from "@/components/GoogleButton";

/**
 * Sign-up is the one moment someone agrees to anything, so it's asked for
 * rather than assumed. The button is held until the box is ticked, and says
 * why when it's pressed early — a button that does nothing reads as broken.
 */
export default function SignUpConsent() {
  const [accepted, setAccepted] = useState(false);
  const [nudged, setNudged] = useState(false);
  const boxRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <GoogleButton
        label="Sign up with Google"
        disabled={!accepted}
        onBlockedClick={() => {
          setNudged(true);
          boxRef.current?.focus();
        }}
      />

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-left">
        <input
          ref={boxRef}
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8C987]"
        />
        <span className="text-[13px] leading-[1.5] text-body-2">
          I accept the{" "}
          <Link href="/terms" className="font-bold text-secondary underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-bold text-secondary underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {nudged && !accepted && (
        <p role="alert" className="mt-3 text-left text-[13px] text-gold">
          Accept the Terms and Privacy Policy to continue.
        </p>
      )}
    </div>
  );
}
