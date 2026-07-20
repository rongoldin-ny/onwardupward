"use client";

import { useEffect, useState } from "react";

/** The lockup's inner content — reusable wherever the logo appears. */
export function LogoMark() {
  return (
    <>
      <span>
        O<span className="ou-rest">NWARD</span>
      </span>
      <svg className="ou-arrow" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <path
          d="M 12 84 L 84 12 M 84 12 L 84 58 M 84 12 L 38 12"
          stroke="#E8C987"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        U<span className="ou-rest">PWARD</span>
      </span>
    </>
  );
}

/**
 * The lockup that abbreviates on scroll: ONWARD ↗ UPWARD collapses to
 * O ↗ U as the user scrolls down, growing back at the top — the inner
 * letters shrink smoothly via the .ou-rest max-width transition.
 */
export function CollapsingLogoMark() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <span className={`contents ${collapsed ? "ou-collapsed" : ""}`}>
      <LogoMark />
    </span>
  );
}
