import Link from "next/link";
import {
  BarChart3,
  Bell,
  ChevronRight,
  GraduationCap,
  Image as ImageIcon,
  UserRound,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { Avatar, Eyebrow, Logo, PageFrame } from "@/components/ui";

function Row({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="list-row flex items-center gap-4 border-b border-border-1 px-5 py-4 last:border-b-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-2 text-secondary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-cream">{label}</span>
        {sub && <span className="mt-0.5 block truncate text-[12.5px] text-secondary">{sub}</span>}
      </span>
      <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
    </Link>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const isCandidate = user.role === "candidate";
  const isRecruiter = user.role === "recruiter";
  const coachListing = isRecruiter ? null : await getCoachByProfileId(user.id);

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>

        <main className="mt-9">
          <div className="flex items-center gap-4">
            <Avatar id={user.id} src={user.photo_url} size={64} halo />
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-black tracking-[-0.02em] text-cream">
                {user.name ?? "Your account"}
              </h1>
              <p className="truncate text-[13px] text-secondary">{user.email}</p>
            </div>
          </div>

          <Eyebrow className="mt-9">Profile</Eyebrow>
          <div className="mt-3 overflow-hidden rounded-[20px] border border-border-1 bg-surface-2">
            {!isRecruiter && (
              <Row
                href="/settings/photo"
                icon={<ImageIcon size={16} strokeWidth={1.5} />}
                label="Change photo"
              />
            )}
            <Row
              href={isRecruiter ? "/settings/search" : "/profile"}
              icon={<UserRound size={16} strokeWidth={1.5} />}
              label={isRecruiter ? "Your search" : "Your profile"}
              sub={isRecruiter ? "Your search preferences" : "View and edit everything others see"}
            />
            {isCandidate && !coachListing && (
              <Row
                href="/profile?side=coach"
                icon={<GraduationCap size={16} strokeWidth={1.5} />}
                label="Coaching"
                sub="Open to mentoring other designers and PMs?"
              />
            )}
            {coachListing && (
              <Row
                href="/settings/coaching-analytics"
                icon={<BarChart3 size={16} strokeWidth={1.5} />}
                label="Coaching analytics"
                sub="Impressions, views, and requests"
              />
            )}
          </div>

          <Eyebrow className="mt-8">Account</Eyebrow>
          <div className="mt-3 overflow-hidden rounded-[20px] border border-border-1 bg-surface-2">
            <Row
              href="/settings/notifications"
              icon={<Bell size={16} strokeWidth={1.5} />}
              label="Notifications"
            />
          </div>
        </main>

        <footer className="mt-auto pt-10">
          <p className="mb-3 text-center text-[12px] text-muted">
            onward/upward is free while we&apos;re in beta — no billing yet.
          </p>
          <p className="mb-6 text-center text-[12px] text-muted">
            <a href="mailto:hello@onwardupward.io" className="text-secondary">
              Contact
            </a>
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="block h-[52px] w-full rounded-full border border-border-2 text-[15px] font-bold text-cream"
            >
              Log out
            </button>
          </form>
        </footer>
      </div>
    </PageFrame>
  );
}
