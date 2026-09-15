"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AlignJustify } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui";

const NAV_ITEMS = [
  { href: "/settings", label: "Settings" },
  { href: "/coaches", label: "Coaches" },
  { href: "/reads", label: "Reads" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNavClient({
  userId,
  photoUrl,
  profileHref,
  isVetter,
}: {
  userId: string;
  photoUrl: string | null;
  profileHref: string;
  isVetter: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = isVetter ? [...NAV_ITEMS, { href: "/admin/waitlist", label: "Admin" }] : NAV_ITEMS;

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
      <div className="fixed top-5 right-5 z-40 md:hidden">
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
              className="flex items-center gap-3 px-5 py-2.5 text-left text-[14px] text-body"
            >
              <Avatar id={userId} src={photoUrl} size={24} />
              Profile
            </Link>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block w-full px-5 py-2.5 text-left text-[14px] ${
                  item.label === "Admin" ? "font-bold text-gold" : "text-body"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => signOut()}
              className="block w-full px-5 py-2.5 text-left text-[14px] text-body"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
