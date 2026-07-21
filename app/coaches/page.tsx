import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDirectoryCoaches } from "@/lib/coaches-db";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";
import CoachesDirectory from "./CoachesDirectory";

export const metadata = { title: "Coaches — onward/upward" };

/**
 * Coach directory with search + smart filters. Unclaimed listings show no
 * direct contact routes; claimed coaches are bookable.
 */
export default async function CoachesPage() {
  await requireUser();
  const coaches = await getDirectoryCoaches();

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
        <header className="flex items-center gap-4">
          <Link href="/" aria-label="Back" className="text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>

        <main className="mt-10">
          <Eyebrow>Train with the best</Eyebrow>
          <h1 className="mt-4 text-[34px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Coaches who&apos;ve made the climb.
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.5] text-secondary">
            A curated bench of design and product leadership coaches. Unclaimed
            profiles haven&apos;t joined the network yet — introductions open up
            once they do.
          </p>

          <CoachesDirectory coaches={coaches} />

          <p className="mt-8 text-[12px] text-muted">
            Unclaimed coaches can&apos;t be contacted through onward/upward yet.
            Know one of them? Encourage them to claim their profile.
          </p>
        </main>
      </div>
    </PageFrame>
  );
}
