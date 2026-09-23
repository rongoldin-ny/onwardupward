"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/coaches", label: "Coaches" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/broadcast", label: "Broadcast" },
  { href: "/admin/feedback", label: "Feedback" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    // Five tabs don't fit a phone, so the row scrolls rather than squashing
    // the labels to three letters each.
    <nav className="mt-8 flex gap-2 overflow-x-auto rounded-full border border-border-1 bg-surface-2 p-1.5">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 shrink-0 rounded-full px-5 py-2.5 text-center text-[14px] font-bold whitespace-nowrap ${
              active ? "gold-gradient text-on-gold" : "text-secondary"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
