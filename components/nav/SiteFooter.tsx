import { HelpCircle } from "lucide-react";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

/**
 * Persistent site-wide footer, mounted once in the root layout. Pinned to
 * opposite corners rather than sitting in the flow: PageFrame's card is
 * min-h-dvh, so an in-flow footer fell below the fold on every phone-sized
 * screen. Each wrapper ignores pointer events so it can never swallow a
 * click meant for the page — only the links/buttons inside opt back in.
 */
export default function SiteFooter() {
  return (
    <>
      <div className="pointer-events-none fixed bottom-4 left-5 z-30 text-[10px] font-bold tracking-[0.14em] text-muted uppercase md:bottom-5 md:left-7">
        <a
          href="https://formativelabs.co/"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto"
        >
          © 2026 Formative Labs
        </a>
      </div>
      <footer className="pointer-events-none fixed right-5 bottom-4 z-30 flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-muted uppercase md:right-7 md:bottom-5">
        <FeedbackWidget />
        <a
          href="mailto:hello@onwardupward.io"
          className="pointer-events-auto flex h-8 items-center gap-1.5 rounded-full border border-gold-border bg-surface-2 px-3 text-gold shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
        >
          <HelpCircle size={12} strokeWidth={2} />
          Help
        </a>
      </footer>
    </>
  );
}
