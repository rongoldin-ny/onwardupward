"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/app/actions/track";
import { recordRoute } from "@/lib/route-history";

/** Logs every route change as a page_view analytics event, and remembers it for close buttons. */
export default function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    recordRoute(pathname);
    void trackPageView(pathname).catch(() => {});
  }, [pathname]);

  return null;
}
