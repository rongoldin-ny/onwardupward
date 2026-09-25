"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AlignJustify, Settings } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui";

const NAV_ITEMS = [
  { href: "/coaches", label: "Coaches" },
  { href: "/reads", label: "Reads" },
];

/**
 * Profile-style pages (your own profile, coach detail, share links) carry
 * their own close button and header actions in the top-right corner, where
 * the fixed mobile menu would sit on top of them.
 */
const OWN_CHROME = /^\/(profile|p\/[^/]+|coaches\/[^/]+)\/?$/;

/**
 * Sign-up (role picker, onboarding wizard) and the waitlist get a bare nav:
 * nothing to wander off to mid-sign-up, and nothing a waitlisted member can
 * open yet. The waitlist screen carries its own sign-out, so it gets none.
 */
const SIGNUP_FLOW = /^\/(role|onboarding|waitlist)(\/|$)/;

export function inSignupFlow(pathname: string, waitlisted: boolean): boolean {
  return waitlisted || SIGNUP_FLOW.test(pathname);
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNavClient({
  userId,
  photoUrl,
  profileHref,
  isVetter,
  waitlisted,
}: {
  userId: string;
  photoUrl: string | null;
  profileHref: string;
  isVetter: boolean;
  waitlisted: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (inSignupFlow(pathname, waitlisted)) {
    if (pathname.startsWith("/waitlist")) return null;
    return (
      <nav className="fixed top-5 right-5 z-40 flex items-center gap-6 md:right-7">
        {isVetter && (
          <span className="hidden items-center gap-6 md:flex">
            <Link href="/members" className="text-[14px] font-bold text-secondary">
              Members
            </Link>
            <Link href="/admin/waitlist" className="text-[14px] font-bold text-gold">
              Admin
            </Link>
          </span>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          className="flex h-9 items-center text-[14px] font-bold text-secondary"
        >
          Sign out
        </button>
      </nav>
    );
  }

  // Admins also get the Members directory (next to Coaches) and the Admin area.
  const items = isVetter
    ? [NAV_ITEMS[0], { href: "/members", label: "Members" }, ...NAV_ITEMS.slice(1), { href: "/admin/waitlist", label: "Admin" }]
    : NAV_ITEMS;

  return (
    <>
      {/* Desktop: full nav row, level with the fixed top-left logo. */}
      <nav className="fixed top-5 right-7 z-40 hidden items-center gap-6 md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[14px] font-bold ${
              isActive(pathname, item.href)
                ? item.label === "Admin"
                  ? "text-gold"
                  : "text-cream"
                : "text-secondary"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/settings"
          aria-label="Settings"
          className={isActive(pathname, "/settings") ? "text-cream" : "text-secondary"}
        >
          <Settings size={18} strokeWidth={1.5} />
        </Link>
        <Link href={profileHref} aria-label="Your profile">
          <Avatar
            id={userId}
            src={photoUrl}
            size={36}
            halo={isActive(pathname, "/profile")}
          />
        </Link>
      </nav>

      {/* Mobile: a persistent corner menu, overlaying whatever the page renders. */}
      <div className={`fixed top-5 right-5 z-40 md:hidden ${OWN_CHROME.test(pathname) ? "hidden" : ""}`}>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-2 bg-surface-1"
        >
          <AlignJustify size={16} strokeWidth={1.5} className="text-secondary" />
        </button>
        {open && (
          <div className="absolute top-12 right-0 w-48 rounded-[16px] border border-border-1 bg-surface-2 py-2">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="list-row flex items-center gap-3 px-5 py-2.5 text-left text-[14px] text-body"
            >
              <Avatar id={userId} src={photoUrl} size={24} />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="list-row flex items-center gap-3 px-5 py-2.5 text-left text-[14px] text-body"
            >
              <Settings size={16} strokeWidth={1.5} className="text-secondary" />
              Settings
            </Link>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`list-row block w-full px-5 py-2.5 text-left text-[14px] ${
                  item.label === "Admin" ? "font-bold text-gold" : "text-body"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => signOut()}
              className="list-row block w-full px-5 py-2.5 text-left text-[14px] text-body"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
