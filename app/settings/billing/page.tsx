import { Check, Sparkle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, ComingSoonPill, Eyebrow } from "@/components/ui";
import SettingsShell from "../SettingsShell";

const upcoming = [
  "Upgrade or downgrade plans",
  "Pause or cancel your subscription",
  "View billing history",
];

export default async function BillingSettingsPage() {
  const user = await requireUser();
  const included =
    user.role === "recruiter"
      ? ["Unlimited AI-powered search", "Full profiles, portfolios & references", "Direct contact with candidates"]
      : ["A profile that gets you found", "Weekly view stats & ranking", "Direct messages from companies"];

  return (
    <SettingsShell title="Billing." subtitle="Where you are today, and what's coming.">
      <Card highlighted className="p-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Current plan</Eyebrow>
          <span className="gold-gradient flex h-9 w-9 items-center justify-center rounded-full">
            <Sparkle size={16} strokeWidth={0} fill="#17130A" />
          </span>
        </div>
        <h2 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-cream">
          Free preview
        </h2>
        <p className="mt-1.5 text-[13px] text-secondary">
          Everything included while onward/upward is in preview. Paid plans arrive later —
          you&apos;ll choose before anything changes.
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
      </Card>

      <Eyebrow className="mt-8">Coming with paid plans</Eyebrow>
      <div className="mt-3 space-y-3">
        {upcoming.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between gap-4 rounded-[20px] border border-dashed border-border-1 bg-surface-disabled px-5 py-4 opacity-65"
          >
            <p className="text-[14px] font-medium text-secondary">{item}</p>
            <ComingSoonPill />
          </div>
        ))}
      </div>
    </SettingsShell>
  );
}
