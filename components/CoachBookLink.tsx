"use client";

import { trackCoachView } from "@/app/actions/track";

/** Book CTA that logs a "request" event before handing off to the booking link. */
export default function CoachBookLink({
  coachId,
  coachName,
  href,
  className,
  children,
}: {
  coachId: string;
  coachName: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noreferrer"
      onClick={() => void trackCoachView(coachId, coachName, "book")}
      className={className}
    >
      {children}
    </a>
  );
}
