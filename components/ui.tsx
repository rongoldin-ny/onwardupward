import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

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
  className = "",
  children,
}: {
  size?: FrameSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col sm:my-6 sm:min-h-[calc(100dvh-3rem)] md:mt-24 md:mb-8 md:min-h-0 md:px-6 lg:mt-24 lg:mb-10 ${frameWidth[size]}`}
    >
      {/* Desktop chrome: logo at the top-left of the browser, outside the card.
          In-card logos carry md:hidden so mobile keeps its inline logo. */}
      <div className="fixed top-6 left-7 z-40 hidden md:block">
        <Logo />
      </div>
      <div
        className={`relative flex w-full flex-1 flex-col overflow-hidden bg-surface-1 sm:rounded-[28px] md:flex-none md:rounded-[32px] md:border md:border-border-1 md:shadow-[0_30px_90px_rgba(0,0,0,0.55)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/** The lockup's inner content — reusable wherever the logo appears. */
export function LogoMark() {
  return (
    <>
      <span>ONWARD</span>
      <svg className="ou-arrow" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <path
          d="M 12 84 L 84 12 M 84 12 L 84 58 M 84 12 L 38 12"
          stroke="#E8C987"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>UPWARD</span>
    </>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="onward/upward — home"
      className="ou-logo text-[19px] font-black tracking-[-0.02em] text-cream hover:text-cream"
    >
      <LogoMark />
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
      className={`block h-[52px] w-full rounded-full text-[15px] font-bold ${ctaStyles[variant]} ${className}`}
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
      className={`flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-bold ${ctaStyles[variant]} ${className}`}
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

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-gold-border px-3 py-1.5 text-[11px] font-medium text-gold">
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
