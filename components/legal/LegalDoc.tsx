import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, PageFrame } from "@/components/ui";

/** Shared layout for the privacy policy and terms: title, dated, sectioned, readable width. */
export function LegalDoc({
  eyebrow,
  title,
  updated,
  summary,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  /** Human date, e.g. "September 16, 2026". */
  updated: string;
  summary?: ReactNode;
  /** In order, for the contents list: [id, heading]. */
  sections: [string, string][];
  children: ReactNode;
}) {
  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-12 lg:px-14">
        <header className="md:hidden">
          <Logo />
        </header>
        <main className="mx-auto mt-10 w-full max-w-[680px] md:mt-4">
          <p className="eyebrow text-secondary">{eyebrow}</p>
          <h1 className="mt-4 text-[36px] leading-[1.08] font-black tracking-[-0.025em] text-balance text-cream">
            {title}
          </h1>
          <p className="mt-3 text-[14px] text-muted">Last updated {updated}</p>

          {summary && (
            <div className="mt-8 rounded-[20px] border border-gold-border bg-gold-tint p-6">
              <p className="eyebrow text-gold">The short version</p>
              <div className="mt-3 text-[15px] leading-[1.6] text-body">{summary}</div>
            </div>
          )}

          <nav aria-label="Contents" className="mt-8 border-y border-border-1 py-5">
            <p className="eyebrow text-secondary">Contents</p>
            <ol className="mt-3 grid list-decimal gap-x-8 gap-y-1.5 pl-5 text-[14px] text-secondary marker:text-muted sm:grid-cols-2">
              {sections.map(([id, heading]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-secondary">
                    {heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-2">{children}</div>

          <p className="mt-12 border-t border-border-1 pt-6 text-[14px] text-secondary">
            Questions? Email{" "}
            <a href="mailto:hello@onwardupward.io" className="font-bold">
              hello@onwardupward.io
            </a>
            . See also our{" "}
            <Link href={title.startsWith("Privacy") ? "/terms" : "/privacy"} className="font-bold">
              {title.startsWith("Privacy") ? "Terms of Service" : "Privacy Policy"}
            </Link>
            .
          </p>
        </main>
      </div>
    </PageFrame>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 pt-10">
      <h2 className="text-[21px] leading-[1.2] font-black tracking-[-0.02em] text-balance text-cream">{title}</h2>
      <div className="mt-3 space-y-3.5 text-[15px] leading-[1.65] text-body-2 [&_strong]:font-bold [&_strong]:text-body">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-gold">{children}</ul>;
}
