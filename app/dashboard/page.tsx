import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCandidate } from "@/lib/auth";
import { candidateStats, profileIncomplete } from "@/lib/stats";
import { greeting } from "@/lib/greeting";
import { signOut } from "@/app/actions/auth";
import DashboardMenu from "./DashboardMenu";
import {
  Avatar,
  Card,
  ComingSoonPill,
  CtaLink,
  Eyebrow,
  Logo,
  PageFrame,
} from "@/components/ui";

export default async function Dashboard() {
  const user = await requireCandidate();
  const stats = await candidateStats(user.id);
  const firstName = (user.name ?? "there").split(" ")[0];
  const incomplete = profileIncomplete(user);

  return (
    <PageFrame size="wide">
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8 lg:px-10 lg:pb-10">
      <header className="flex items-center justify-between">
        <span className="md:hidden"><Logo /></span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/settings" aria-label="Settings">
            <Avatar id={user.id} src={user.photo_url} size={40} />
          </Link>
          <DashboardMenu />
        </div>
      </header>

      <main className="mt-12 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10">
        <div>
          <h1 className="text-[38px] leading-[1.15] font-black tracking-[-0.02em] text-cream">
            {greeting()},<br />
            <span className="text-secondary">{firstName}.</span>
          </h1>

          <Card className="mt-9 p-6">
            <Eyebrow>Your profile, this week</Eyebrow>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-[56px] leading-none font-black tracking-[-0.02em] text-cream">
                {stats.viewsThisWeek}
              </span>
              {stats.deltaPct !== null && (
                <span
                  className={`pb-1.5 text-[15px] font-bold ${
                    stats.deltaPct >= 0 ? "text-success" : "text-secondary"
                  }`}
                >
                  {stats.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(stats.deltaPct)}% vs last week
                </span>
              )}
            </div>
            <p className="mt-2 text-[15px] text-secondary">
              views · {stats.viewsToday} today
            </p>
            <hr className="my-5 border-border-1" />
            {stats.viewsThisWeek > 0 ? (
              <p className="text-[15px] text-body">
                You&apos;re in the{" "}
                <span className="font-bold text-gold">top {stats.topPct}%</span> of profiles
                this week.
              </p>
            ) : (
              <p className="text-[15px] text-secondary">
                Your profile is live — views will show up here.
              </p>
            )}
          </Card>

          <CtaLink href="/profile/preview" variant="secondary" className="mt-4">
            Preview my profile
          </CtaLink>

          {incomplete && (
            <Link href="/profile/edit" className="mt-4 block">
              <Card highlighted>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                    Finish your profile
                  </h2>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <p className="mt-1.5 text-[13px] text-secondary">
                  Add your portfolio to get discovered.
                </p>
              </Card>
            </Link>
          )}
        </div>

        <div className="mt-9 lg:mt-0">
          <Eyebrow>Recommended coaches</Eyebrow>
          <div className="mt-4 flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border-1 bg-surface-disabled px-5 py-9 opacity-65">
            <ComingSoonPill />
            <p className="text-center text-[13px] text-secondary">
              Coaching from designers you admire.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-10 text-center lg:text-left">
        <form action={signOut}>
          <button type="submit" className="text-[13px] text-muted">
            Sign out
          </button>
        </form>
      </footer>
    </div>
    </PageFrame>
  );
}
