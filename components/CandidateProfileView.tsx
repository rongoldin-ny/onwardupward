"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Link2, X } from "lucide-react";
import { sendMessage, trackElementClick } from "@/app/actions/engage";
import { Avatar, Card, Cta, CtaLink, Eyebrow, PageFrame, Tag } from "@/components/ui";
import type { PortfolioImage } from "@/lib/db";

export type CandidateView = {
  id: string;
  name: string;
  photoUrl: string | null;
  roleLabel: string;
  city: string;
  firstName: string;
  bio: string | null;
  dreamJob: string | null;
  lastRole: string | null;
  brags: string[];
  companies: string[];
  references: { name: string; title: string; linkedin: string | null }[];
  portfolioUrl: string | null;
  portfolioPassword: string | null;
  portfolioImages: PortfolioImage[];
  yearsExperience: number | null;
  industries: string[];
  contactNote: string;
};

/**
 * One portfolio image: full-bleed within the card on desktop; on mobile it
 * starts slightly inset and zooms to edge-to-edge as it scrolls into view.
 */
function WorkImage({ image }: { image: PortfolioImage }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.45),
      { threshold: [0, 0.45, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const metaLine = [image.company, image.year].filter(Boolean).join(" · ");

  return (
    <figure ref={ref} className="m-0">
      <div
        className={`overflow-hidden transition-all duration-700 ease-out ${
          inView ? "scale-100 rounded-none opacity-100" : "scale-[0.94] rounded-[20px] opacity-70"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.caption || "Portfolio piece"}
          className={`block h-auto w-full transition-transform duration-700 ease-out ${
            inView ? "scale-100" : "scale-105"
          }`}
        />
      </div>
      {(metaLine || image.caption) && (
        <figcaption className="px-6 pt-3 pb-1 lg:px-10">
          {metaLine && <span className="eyebrow block text-gold">{metaLine}</span>}
          {image.caption && (
            <span className="mt-1.5 block text-[13px] leading-[1.5] text-secondary">
              {image.caption}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export default function CandidateProfileView({
  candidate,
  mode,
}: {
  candidate: CandidateView;
  mode: "recruiter" | "preview" | "public";
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const track = (element: "linkedin" | "reference" | "portfolio" | "contact") => {
    if (mode === "recruiter") void trackElementClick(candidate.id, element);
  };

  async function send() {
    setSending(true);
    const result = await sendMessage(candidate.id, message);
    setSending(false);
    if (result.error) {
      setToast(result.error);
      return;
    }
    setDrawerOpen(false);
    setMessage("");
    setToast("Message sent ✓");
  }

  return (
    <PageFrame size="modal">
    <div className="flex flex-1 flex-col">
      {mode === "preview" && (
        <div className="border-b border-gold-border bg-gold-tint px-6 py-3 text-center text-[13px] text-gold">
          This is how recruiters see your profile.
        </div>
      )}
      {mode === "public" && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-gold-border bg-gold-tint px-6 py-4">
          <p className="text-[14px] font-bold text-gold">
            onward/upward — a private growth network for designers.
          </p>
          <Link
            href="/signup"
            className="gold-gradient cta-glow shrink-0 rounded-full px-5 py-2.5 text-[14px] font-bold text-on-gold"
          >
            Sign up to join the network
          </Link>
        </div>
      )}

      <div
        className={`flex flex-1 flex-col px-6 pt-6 pb-8 transition-[filter,opacity] duration-300 lg:px-10 lg:pb-10 ${
          drawerOpen ? "opacity-40 blur-[2px] lg:opacity-100 lg:blur-none" : ""
        }`}
      >
        <div className="hero-glow" />
        {mode !== "public" && (
          <header className="flex items-center justify-end gap-3">
            {mode === "preview" && (
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/p/${candidate.id}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    setToast("Public link copied ✓ — no sign-in needed to view");
                  } catch {
                    setToast(url);
                  }
                }}
                className="flex h-11 items-center gap-2 rounded-full border border-gold-border px-5 text-[14px] font-bold text-gold"
              >
                <Link2 size={15} strokeWidth={1.75} />
                Share
              </button>
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border-2"
            >
              <X size={16} strokeWidth={1.5} className="text-secondary" />
            </button>
          </header>
        )}

        <main className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-12">
          <div className="flex flex-col items-center text-center lg:sticky lg:top-2 lg:items-start lg:text-left">
            <Avatar id={candidate.id} src={candidate.photoUrl} size={132} halo />
            <h1 className="mt-7 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
              {candidate.name}
            </h1>
            <p className="mt-2.5 text-[16px] text-secondary">
              {candidate.roleLabel} — {candidate.city}
            </p>
            {(candidate.yearsExperience !== null || candidate.industries.length > 0) && (
              <p className="mt-2 text-[13px] text-secondary">
                {[
                  candidate.yearsExperience !== null
                    ? `${candidate.yearsExperience} years`
                    : "",
                  ...candidate.industries,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {candidate.companies.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-start">
                {candidate.companies.map((company) => (
                  <Tag key={company}>{company}</Tag>
                ))}
              </div>
            )}
            <div className="mt-8 hidden w-full lg:block">
              {mode === "recruiter" ? (
                <Cta
                  variant="inverted"
                  onClick={() => {
                    track("contact");
                    setDrawerOpen(true);
                  }}
                >
                  Get in touch
                </Cta>
              ) : mode === "public" ? (
                <CtaLink href="/signup">Join the network</CtaLink>
              ) : (
                <Link
                  href="/settings/profile"
                  className="block text-center text-[15px] font-bold text-gold"
                >
                  Edit profile
                </Link>
              )}
            </div>
          </div>

          <div className="mt-9 lg:mt-0">
          {candidate.bio && (
            <Card className="mt-9">
              <Eyebrow>About</Eyebrow>
              <p
                className={`mt-3.5 text-[14px] leading-[1.55] text-body-2 ${
                  bioExpanded ? "" : "line-clamp-3"
                }`}
              >
                {candidate.bio}
              </p>
              {candidate.bio.length > 140 && (
                <button
                  type="button"
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-2 text-[13px] font-bold text-gold"
                >
                  {bioExpanded ? "Read less" : "Read more"}
                </button>
              )}
            </Card>
          )}

          {candidate.dreamJob && (
            <Card className="mt-4">
              <Eyebrow>The dream job</Eyebrow>
              <p className="mt-3.5 text-[16px] leading-[1.5] text-body">
                {candidate.dreamJob}
              </p>
            </Card>
          )}

          {candidate.lastRole && (
            <Card className="mt-4">
              <Eyebrow>In my last role</Eyebrow>
              <p className="mt-3.5 text-[16px] leading-[1.5] text-body">
                {candidate.lastRole}
              </p>
            </Card>
          )}

          {candidate.brags.length > 0 && (
            <Card className="mt-4">
              <Eyebrow>Humblebrags</Eyebrow>
              <ol className="mt-4 space-y-3.5">
                {candidate.brags.map((brag, i) => (
                  <li key={brag} className="flex gap-3.5 text-[15px] leading-[1.5]">
                    <span className="font-bold text-gold">{i + 1}</span>
                    <span className="text-body">{brag}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {candidate.references.length > 0 && (
            <Card className="mt-4">
              <Eyebrow>References</Eyebrow>
              <ul className="mt-4 space-y-4">
                {candidate.references.map((ref) => (
                  <li key={ref.name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-cream">{ref.name}</p>
                      <p className="truncate text-[13px] text-secondary">{ref.title}</p>
                    </div>
                    {ref.linkedin && (
                      <a
                        href={ref.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${ref.name} on LinkedIn`}
                        onClick={() => track("reference")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-2"
                      >
                        <ArrowUpRight size={15} strokeWidth={1.5} className="text-gold" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          </div>
        </main>

        {/* Work spans the full card width, outside the sidebar/content grid. */}
        {(candidate.portfolioUrl || candidate.portfolioImages.length > 0) && (
          <section className="mt-9 lg:mt-14">
            {candidate.portfolioUrl && (
              <div className="flex flex-col items-center gap-3.5">
                <a
                  href={candidate.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("portfolio")}
                  className="gold-gradient cta-glow rounded-full px-12 py-[18px] text-[16px] font-bold text-on-gold"
                >
                  Portfolio
                </a>
                {candidate.portfolioPassword && mode !== "public" && (
                  <p className="text-[13px] text-secondary">
                    password: {candidate.portfolioPassword}
                  </p>
                )}
              </div>
            )}
            {candidate.portfolioImages.length > 0 && (
              <div className="mt-10 -mx-6 space-y-10 lg:-mx-10">
                {candidate.portfolioImages.map((image) => (
                  <WorkImage key={image.url} image={image} />
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="mt-auto pt-8 lg:hidden">
          {mode === "recruiter" ? (
            <Cta
              variant="inverted"
              onClick={() => {
                track("contact");
                setDrawerOpen(true);
              }}
            >
              Get in touch
            </Cta>
          ) : mode === "public" ? (
            <CtaLink href="/signup">Join the network</CtaLink>
          ) : (
            <Link
              href="/settings/profile"
              className="block text-center text-[15px] font-bold text-gold"
            >
              Edit profile
            </Link>
          )}
        </footer>
      </div>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close drawer"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-10 cursor-default bg-[rgba(10,10,12,0.55)]"
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] rounded-t-[28px] border-t border-gold-border bg-surface-2 px-6 pt-3 pb-7 transition-all duration-300 lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85vh] lg:w-[440px] lg:max-w-[440px] lg:overflow-y-auto lg:rounded-[28px] lg:border lg:pt-7 ${
          drawerOpen
            ? "translate-y-0 lg:scale-100 lg:opacity-100"
            : "translate-y-full lg:translate-y-0 lg:pointer-events-none lg:scale-95 lg:opacity-0"
        }`}
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-border-2 lg:hidden" />
        <h2 className="mt-6 text-[26px] font-black tracking-[-0.02em] text-cream">
          Write to {candidate.firstName}
        </h2>
        <p className="mt-2 text-[15px] text-secondary">{candidate.contactNote}</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Hi ${candidate.firstName} — I lead design at… and your work on…`}
          rows={6}
          className="mt-5 w-full resize-none rounded-[20px] border border-border-1 bg-surface-1 px-6 py-5 text-[15px] leading-[1.5] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
        />
        <Cta className="mt-4" onClick={send} disabled={sending}>
          {sending ? "Sending…" : "Send message"}
        </Cta>
      </div>

      <div
        className={`fixed top-6 left-1/2 z-30 w-[calc(100%-48px)] max-w-[382px] -translate-x-1/2 rounded-full border border-gold-border bg-surface-2 px-6 py-4 text-center text-[15px] font-medium text-cream transition-opacity duration-300 ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </div>
    </div>
    </PageFrame>
  );
}
