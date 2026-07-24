import Link from "next/link";
import { Check, GraduationCap, Sparkle, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { deriveBillingPlan, PILOT_PRICING_NOTE, PLAN_INFO } from "@/lib/billing";
import { cancelSupporter } from "@/app/actions/supporter";
import { Card, Eyebrow } from "@/components/ui";
import SettingsShell from "../SettingsShell";

const PLAN_ICON = {
  player_basic: Sparkle,
  player_supporter: Star,
  coach: GraduationCap,
  player_coach: GraduationCap,
} as const;

export default async function BillingSettingsPage() {
  const user = await requireUser();

  if (user.role === "recruiter") {
    return (
      <SettingsShell title="Billing." subtitle="Your plan, and where it can go.">
        <Card highlighted className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Current plan</Eyebrow>
            <span className="gold-gradient flex h-9 w-9 items-center justify-center rounded-full">
              <Sparkle size={16} strokeWidth={0} fill="#17130A" />
            </span>
          </div>
          <h2 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-cream">Recruiter</h2>
          <p className="mt-1.5 text-[13px] text-secondary">$199 / month. {PILOT_PRICING_NOTE}</p>
          <hr className="my-5 border-border-1" />
          <ul className="space-y-3">
            {[
              "Unlimited AI-powered search",
              "Full profiles, portfolios & references",
              "Direct contact with candidates",
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-[14px] text-body">
                <Check size={15} strokeWidth={2} className="shrink-0 text-gold" />
                {perk}
              </li>
            ))}
          </ul>
        </Card>
      </SettingsShell>
    );
  }

  const hasCoachListing = user.role === "candidate" ? !!(await getCoachByProfileId(user.id)) : false;
  const plan = deriveBillingPlan(user, hasCoachListing);
  const info = PLAN_INFO[plan];
  const Icon = PLAN_ICON[plan];

  return (
    <SettingsShell title="Billing." subtitle="Your plan, and where it can go.">
      <Card highlighted className="p-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Current plan</Eyebrow>
          <span className="gold-gradient flex h-9 w-9 items-center justify-center rounded-full">
            <Icon size={16} strokeWidth={0} fill="#17130A" />
          </span>
        </div>
        <h2 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-cream">{info.label}</h2>
        <p className="mt-1.5 text-[13px] text-secondary">
          {info.price === "Free" ? "Free while onward/upward is in preview." : `${info.price}.`}{" "}
          {PILOT_PRICING_NOTE}
        </p>
        <hr className="my-5 border-border-1" />
        <ul className="space-y-3">
          {info.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-[14px] text-body">
              <Check size={15} strokeWidth={2} className="shrink-0 text-gold" />
              {perk}
            </li>
          ))}
        </ul>
        {plan === "player_supporter" && (
          <form action={cancelSupporter} className="mt-6">
            <button type="submit" className="text-[13px] text-muted underline-offset-2 hover:underline">
              Cancel Supporter
            </button>
          </form>
        )}
      </Card>

      {plan === "player_basic" && (
        <Link href="/supporter" className="mt-4 block">
          <Card className="border-gold-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                  Become a Supporter
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
                  {PLAN_INFO.player_supporter.price} — your profile gets first looks in recruiter
                  searches, first crack at hot opportunities, and early access to new features.
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
