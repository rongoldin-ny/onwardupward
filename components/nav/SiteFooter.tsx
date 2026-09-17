import Link from "next/link";
import { HelpCircle } from "lucide-react";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

/**
 * Site-wide footer, mounted once in the root layout.
 *
 * The legal row sits in the page flow at the very bottom, at every size —
 * fine print doesn't need to follow the reader around, and pinning it meant
 * it overlapped whatever each page put in its own corners.
 *
 * Feedback and Help are the one part that stays floating (icon-only circles,
 * labels via tooltip), and only for signed-in users: a visitor on the
 * landing, the auth screens or a shared profile has nothing to report yet,
 * and the buttons competed with the sign-up CTA those pages exist for.
 */
export default function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <div className="px-5 pt-6 pb-8 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="https://formativelabs.co/" target="_blank" rel="noreferrer">
            © 2026 Formative Labs
          </a>
          <Link href="/privacy" className="text-muted">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted">
            Terms
          </Link>
        </div>
      </div>
      {signedIn && (
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
      )}
    </>
  );
}
