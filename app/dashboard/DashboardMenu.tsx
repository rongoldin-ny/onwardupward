"use client";

import { useState } from "react";
import Link from "next/link";
import { AlignJustify } from "lucide-react";
import { signOut } from "@/app/actions/auth";

/** Corner hamburger for the candidate home — mirrors the recruiter search menu. */
export default function DashboardMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border-2"
      >
        <AlignJustify size={16} strokeWidth={1.5} className="text-secondary" />
      </button>
      {open && (
        <div className="absolute top-12 right-0 z-10 w-44 rounded-[16px] border border-border-1 bg-surface-2 py-2">
          <Link
            href="/settings"
            className="block w-full px-5 py-2.5 text-left text-[14px] text-body"
          >
            Settings
          </Link>
          <Link
            href="/profile/preview"
            className="block w-full px-5 py-2.5 text-left text-[14px] text-body"
          >
            Preview profile
          </Link>
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
  );
}
