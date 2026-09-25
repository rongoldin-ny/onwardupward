"use client";

import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { inSignupFlow } from "./SiteNavClient";

/** The floating Feedback and Help buttons, hidden during sign-up and on the waitlist. */
export default function FloatingHelp({ waitlisted }: { waitlisted: boolean }) {
  const pathname = usePathname();
  if (inSignupFlow(pathname, waitlisted)) return null;
  return (
    // pointer-events-none on the wrapper so a fixed strip can never
    // swallow a click meant for the page — only the buttons opt back in.
    <footer className="pointer-events-none fixed right-5 bottom-4 z-30 flex items-center gap-2 md:right-7 md:bottom-5">
      <FeedbackWidget />
      <a
        href="mailto:hello@onwardupward.io"
        aria-label="Help"
        title="Help"
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-gold-border bg-surface-2 text-gold shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
      >
        <HelpCircle size={15} strokeWidth={2} />
      </a>
    </footer>
  );
}
