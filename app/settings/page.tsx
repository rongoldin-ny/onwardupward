import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  Image as ImageIcon,
  KeyRound,
  UserRound,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
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
      className="flex items-center gap-4 border-b border-border-1 px-5 py-4 last:border-b-0"
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
            {isCandidate && (
              <Row
                href="/settings/photo"
                icon={<ImageIcon size={16} strokeWidth={1.5} />}
                label="Change photo"
              />
            )}
            <Row
              href="/settings/profile"
              icon={<UserRound size={16} strokeWidth={1.5} />}
              label="Edit profile"
              sub={isCandidate ? "Everything recruiters see about you" : "Your search preferences"}
            />
            {isCandidate && (
              <Row
                href="/profile/preview"
                icon={<Eye size={16} strokeWidth={1.5} />}
                label="View profile"
                sub="As recruiters see it"
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
            <Row
              href="/settings/billing"
              icon={<CreditCard size={16} strokeWidth={1.5} />}
              label="Billing"
              sub="Free preview plan"
            />
            <Row
              href="/settings/password"
              icon={<KeyRound size={16} strokeWidth={1.5} />}
              label="Password"
            />
          </div>
        </main>

        <footer className="mt-auto pt-10">
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
