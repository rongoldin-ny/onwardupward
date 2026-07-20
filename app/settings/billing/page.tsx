import Link from "next/link";
import { Check, Sparkle, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { cancelSupporter } from "@/app/actions/supporter";
import { Card, Eyebrow, SupporterBadge } from "@/components/ui";
import SettingsShell from "../SettingsShell";

export default async function BillingSettingsPage() {
  const user = await requireUser();
  const supporter = user.role === "candidate" && user.is_supporter;
  const included =
    user.role === "recruiter"
      ? ["Unlimited AI-powered search", "Full profiles, portfolios & references", "Direct contact with candidates"]
      : supporter
        ? [
            "Gold Supporter badge next to your name",
            "Prioritized ranking in recruiter searches",
            "First in line for hot opportunities",
            "Early access to new features",
          ]
        : ["A profile that gets you found", "Weekly view stats & ranking", "Direct messages from companies"];

  return (
    <SettingsShell title="Billing." subtitle="Your plan, and where it can go.">
      <Card highlighted className="p-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Current plan</Eyebrow>
          <span className="gold-gradient flex h-9 w-9 items-center justify-center rounded-full">
            {supporter ? (
              <Star size={16} strokeWidth={0} fill="#17130A" />
            ) : (
              <Sparkle size={16} strokeWidth={0} fill="#17130A" />
            )}
          </span>
        </div>
        <h2 className="mt-3 flex items-center gap-3 text-[24px] font-black tracking-[-0.02em] text-cream">
          {supporter ? "Supporter" : "Free preview"}
          {supporter && <SupporterBadge />}
        </h2>
        <p className="mt-1.5 text-[13px] text-secondary">
          {supporter
            ? "$4.99 / month — thank you for backing the network."
            : "Everything included while onward/upward is in preview."}
        </p>
        <hr className="my-5 border-border-1" />
        <ul className="space-y-3">
          {included.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-[14px] text-body">
              <Check size={15} strokeWidth={2} className="shrink-0 text-gold" />
              {perk}
            </li>
          ))}
        </ul>
        {supporter && (
          <form action={cancelSupporter} className="mt-6">
            <button type="submit" className="text-[13px] text-muted underline-offset-2 hover:underline">
              Cancel Supporter
            </button>
          </form>
        )}
      </Card>

      {user.role === "candidate" && !supporter && (
        <Link href="/supporter" className="mt-4 block">
          <Card className="border-gold-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2.5 text-[18px] font-bold tracking-[-0.02em] text-cream">
                  Become a Supporter <SupporterBadge size="sm" />
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
                  $4.99/mo — a gold badge, priority in recruiter searches, first
                  crack at hot opportunities, early access to new features.
                </p>
              </div>
              <span className="text-[20px] text-gold">→</span>
            </div>
          </Card>
        </Link>
      )}
    </SettingsShell>
  );
}
