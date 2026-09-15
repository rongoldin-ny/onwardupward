"use client";

import { usePathname } from "next/navigation";

/**
 * Persistent site-wide footer, mounted once in the root layout. The
 * signed-out landing page (AscentHome) has its own bespoke footer, so this
 * one stays hidden there.
 */
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="mx-auto w-full max-w-[1008px] px-6 py-8 text-center">
      <a href="mailto:hello@onwardupward.io" className="text-[12px] text-muted">
        Contact
      </a>
    </footer>
  );
}
