import { Check, GraduationCap, Sparkle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { deriveBillingPlan, PILOT_PRICING_NOTE, PLAN_INFO } from "@/lib/billing";
import { Card, Eyebrow } from "@/components/ui";
import SettingsShell from "../SettingsShell";

const PLAN_ICON = {
  player_basic: Sparkle,
  coach: GraduationCap,
  player_coach: GraduationCap,
} as const;

export default async function BillingSettingsPage() {
  const user = await requireUser();

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
      </Card>
    </SettingsShell>
  );
}
