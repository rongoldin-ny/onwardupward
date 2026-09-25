import Link from "next/link";
import FloatingHelp from "./FloatingHelp";

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
 * They're also kept off sign-up itself and the waitlist — see FloatingHelp.
 */
export default function SiteFooter({
  signedIn,
  waitlisted,
}: {
  signedIn: boolean;
  waitlisted: boolean;
}) {
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
      {signedIn && <FloatingHelp waitlisted={waitlisted} />}
    </>
  );
}
