"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

/** Auth screens keep the phone viewport clear so the sign-in/sign-up switch never gets crowded. */
const NO_COPYRIGHT_ON_MOBILE = ["/signin", "/signup"];

/**
 * Persistent site-wide footer, mounted once in the root layout.
 *
 * Desktop: pinned to opposite corners rather than sitting in the flow —
 * PageFrame's card hugs its content, so corners are always free.
 *
 * Mobile: nothing may sit on top of page content. The copyright drops into
 * the flow at the very bottom of the page, and Feedback/Help are hidden on
 * the signed-out home, which has its own CTA-led footer.
 *
 * Feedback/Help are icon-only circles at every size (labels via tooltip).
 * Each fixed wrapper ignores pointer events so it can never swallow a click
 * meant for the page — only the buttons opt back in.
 */
export default function SiteFooter() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hideCopyrightOnMobile = NO_COPYRIGHT_ON_MOBILE.includes(pathname);

  return (
    <>
      <div
        className={`px-5 pt-6 pb-8 text-[10px] font-bold tracking-[0.14em] text-muted uppercase md:pointer-events-none md:fixed md:bottom-5 md:left-7 md:z-30 md:p-0 ${
          hideCopyrightOnMobile ? "hidden md:block" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a
            href="https://formativelabs.co/"
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto"
          >
            © 2026 Formative Labs
          </a>
          <Link href="/privacy" className="pointer-events-auto text-muted">
            Privacy
          </Link>
          <Link href="/terms" className="pointer-events-auto text-muted">
            Terms
          </Link>
        </div>
      </div>
      <footer
        className={`pointer-events-none fixed right-5 bottom-4 z-30 items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-muted uppercase md:right-7 md:bottom-5 ${
          isHome ? "hidden md:flex" : "flex"
        }`}
      >
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
    </>
  );
}
