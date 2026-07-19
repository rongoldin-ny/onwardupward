import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { CtaLink, Logo, PageFrame } from "@/components/ui";

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-6">
        <div className="hero-glow" />
        <header className="flex items-center justify-between">
          <Logo />
          <Link href="/signin" className="text-[15px] font-bold">
            Sign in
          </Link>
        </header>

        <main className="mt-[38%]">
          <p className="eyebrow text-secondary">A private talent network</p>
          <h1 className="mt-5 text-[40px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            The best design talent isn&apos;t <span className="text-gold">looking.</span>
            <br />
            We know where they are.
          </h1>
          <p className="mt-6 text-[19px] leading-[1.5] text-secondary">
            Vetted product designers, found by taste — not keywords.
          </p>
        </main>

        <footer className="mt-auto pt-10">
          <div className="flex flex-col gap-3 lg:flex-row">
            <CtaLink href="/signup" className="lg:flex-1">
              Join as a candidate
            </CtaLink>
            <CtaLink href="/signup" variant="secondary" className="lg:flex-1">
              I&apos;m hiring
            </CtaLink>
          </div>
          <div className="mt-7 flex justify-center gap-6 text-[12px] text-muted">
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </footer>
      </div>
    </PageFrame>
  );
}
