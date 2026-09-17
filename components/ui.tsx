import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CollapsingLogoMark } from "./logo";

type FrameSize = "narrow" | "wide" | "modal";

// Widths include the md:px-6 gutter so the card never touches the viewport edge.
const frameWidth: Record<FrameSize, string> = {
  narrow: "md:max-w-[508px]",
  wide: "md:max-w-[1008px]",
  modal: "md:max-w-[1008px]",
};

/**
 * Mobile: full-bleed phone frame (unchanged from the original design).
 * Tablet and up (md+): the same content becomes a bordered card floating on
 * the dark canvas that hugs its content height, width set by `size` — narrow
 * for forms, wide/modal for content-heavy or two-column screens.
 */
export function PageFrame({
  size = "narrow",
  chromeLogo = true,
  centered = false,
  className = "",
  children,
}: {
  size?: FrameSize;
  chromeLogo?: boolean;
  /** Desktop: center the card vertically in the viewport (short, single-task screens like sign-up). */
  centered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const frame = (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col sm:my-6 sm:min-h-[calc(100dvh-3rem)] md:min-h-0 md:px-6 ${
        centered ? "md:my-0" : "md:mt-24 md:mb-8 lg:mt-24 lg:mb-10"
      } ${frameWidth[size]}`}
    >
      {/* Desktop chrome: logo at the top-left of the browser, outside the card.
          In-card logos carry md:hidden so mobile keeps its inline logo. Pages
          that put the logo inside the card instead opt out with chromeLogo. */}
      {chromeLogo && (
        <div className="fixed top-6 left-7 z-40 hidden md:block">
          <Logo />
        </div>
      )}
      {/* overflow-clip, not -hidden: the decorative hero glow is wider than the
          frame, and a merely hidden box is still scrollable — focusing anything
          inside (e.g. the Profile/Coach tabs) shifted the whole screen left by
          the glow's overhang. */}
      <div
        className={`relative flex w-full flex-1 flex-col overflow-clip bg-surface-1 sm:rounded-[28px] md:flex-none md:rounded-[32px] md:border md:border-border-1 md:shadow-[0_30px_90px_rgba(0,0,0,0.55)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
  // The wrapper's vertical padding keeps the card clear of the fixed logo and nav.
  return centered ? (
    <div className="md:flex md:min-h-dvh md:flex-col md:justify-center md:py-24">{frame}</div>
  ) : (
    frame
  );
}

/**
 * The site lockup. Subpages show the abbreviated O ↗ U mark on mobile, where
 * header space is tight; pass `full` on home screens to keep ONWARD ↗ UPWARD.
 * Desktop always starts full and collapses on scroll.
 */
export function Logo({ full = false }: { full?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="onward/upward — home"
      className={`ou-logo text-[19px] font-black tracking-[-0.02em] text-cream hover:text-cream ${
        full ? "" : "ou-compact-mobile"
      }`}
    >
      <CollapsingLogoMark />
    </Link>
  );
}

type CtaVariant = "primary" | "secondary" | "inverted";

const ctaStyles: Record<CtaVariant, string> = {
  primary: "gold-gradient cta-glow text-on-gold",
  secondary: "border border-border-2 text-cream",
  inverted: "bg-cream text-on-gold",
};

export function Cta({
  variant = "primary",
  className = "",
  ...props
}: { variant?: CtaVariant } & ComponentProps<"button">) {
  return (
    <button
      className={`block h-[52px] w-full rounded-full text-[15px] font-bold transition-[filter,transform] active:scale-[0.98] disabled:active:scale-100 ${ctaStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function CtaLink({
  variant = "primary",
  className = "",
  ...props
}: { variant?: CtaVariant } & ComponentProps<typeof Link>) {
  return (
    <Link
      className={`flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-bold transition-[filter,transform] active:scale-[0.98] ${ctaStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  highlighted = false,
  className = "",
  children,
}: {
  highlighted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[20px] border bg-surface-2 p-5 ${
        highlighted ? "border-gold-active" : "border-border-1"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={`eyebrow text-secondary ${className}`}>{children}</p>;
}

type TagVariant = "gold" | "neutral";

const tagStyles: Record<TagVariant, string> = {
  gold: "border-gold-border text-gold",
  neutral: "border-border-2 text-secondary",
};

export function Tag({
  variant = "gold",
  children,
}: {
  variant?: TagVariant;
  children: ReactNode;
}) {
  return (
    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${tagStyles[variant]}`}>
      {children}
    </span>
  );
}

export function ComingSoonPill() {
  return (
    <span className="eyebrow rounded-full border border-gold-border px-3.5 py-2 text-gold">
      Coming soon
    </span>
  );
}

const avatarStops = ["#6E5A33", "#3A3A40", "#2E2E34"];

export function Avatar({
  id,
  src = null,
  size = 48,
  halo = false,
  className = "",
}: {
  id: string;
  src?: string | null;
  size?: number;
  halo?: boolean;
  className?: string;
}) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const stop = avatarStops[Math.abs(hash) % avatarStops.length];
  return (
    <div
      aria-hidden
      className={`shrink-0 overflow-hidden rounded-full ${halo ? "avatar-halo" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, #E8C987, ${stop})`,
      }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
