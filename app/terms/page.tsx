import { Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Terms — onward/upward" };

export default function TermsPage() {
  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header className="flex items-center justify-between">
          <Logo />
        </header>
        <main className="mt-14">
          <h1 className="text-[32px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Terms of service.
          </h1>
          <p className="mt-6 text-[16px] leading-[1.6] text-secondary">
            onward/upward is a private, invite-led network. By using it you agree
            to
            keep member information confidential, represent yourself
            truthfully, and use the network for its intended purpose —
            connecting design talent, coaches, and hiring teams.
          </p>
          <p className="mt-4 text-[16px] leading-[1.6] text-secondary">
            Full terms are being finalized. Questions in the meantime:{" "}
            <a href="mailto:hello@onwardupward.io" className="text-gold">
              hello@onwardupward.io
            </a>
            .
          </p>
        </main>
      </div>
    </PageFrame>
  );
}
