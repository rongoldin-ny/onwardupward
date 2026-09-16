/**
 * Persistent site-wide footer, mounted once in the root layout. Pinned to the
 * corner rather than sitting in the flow: PageFrame's card is min-h-dvh, so an
 * in-flow footer fell below the fold on every phone-sized screen. The wrapper
 * ignores pointer events so it can never swallow a click meant for the page.
 */
export default function SiteFooter() {
  return (
    <footer className="pointer-events-none fixed right-5 bottom-4 z-30 flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-muted uppercase md:right-7 md:bottom-5">
      <a
        href="https://formativelabs.co/"
        target="_blank"
        rel="noreferrer"
        className="pointer-events-auto"
      >
        © 2026 Formative Labs
      </a>
      <span aria-hidden>·</span>
      <a href="mailto:hello@onwardupward.io" className="pointer-events-auto">
        Contact
      </a>
    </footer>
  );
}
