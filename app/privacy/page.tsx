import Link from "next/link";
import { Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Privacy — onward/upward" };

export default function PrivacyPage() {
  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header className="flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
        </header>
        <main className="mt-14">
          <h1 className="text-[32px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Privacy.
          </h1>
          <p className="mt-6 text-[16px] leading-[1.6] text-secondary">
            Your profile is visible only to vetted members of the network —
            never indexed, never sold, never shared outside onward/upward. You can
            edit or delete your information at any time from settings.
          </p>
          <p className="mt-4 text-[16px] leading-[1.6] text-secondary">
            The full privacy policy is being finalized. Questions in the
            meantime:{" "}
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
