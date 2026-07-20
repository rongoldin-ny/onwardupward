import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo, PageFrame } from "@/components/ui";

/** Shared chrome for settings subpages: back arrow + centered title. */
export default function SettingsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-7 pb-8">
        <header className="relative flex items-center justify-center">
          <div className="absolute left-0 flex items-center gap-4">
            <Link href="/settings" aria-label="Back to settings" className="text-cream">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </Link>
            <span className="[&_a]:text-[17px]">
              <Logo />
            </span>
          </div>
          <p className="eyebrow text-secondary">Settings</p>
        </header>
        <main className="mt-9 flex flex-1 flex-col">
          <h1 className="text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-[15px] text-secondary">{subtitle}</p>}
          <div className="mt-7 flex flex-1 flex-col">{children}</div>
        </main>
      </div>
    </PageFrame>
  );
}
