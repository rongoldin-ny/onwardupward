import { redirect } from "next/navigation";
import { Check, Star } from "lucide-react";
import { requireCandidate } from "@/lib/auth";
import { becomeSupporter } from "@/app/actions/supporter";
import { Cta, Eyebrow, Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Supporter — onward/upward" };

const PERKS = [
  "Your profile gets first looks — priority placement in recruiter and hiring-manager searches",
  "First in line for hot opportunities",
  "Early access to new features",
  "You keep an independent network independent",
];

export default async function SupporterPage() {
  const user = await requireCandidate();
  if (user.is_supporter) redirect("/settings/billing");

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <div className="hero-glow" />
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>

        <main className="mt-12 flex flex-col items-center text-center">
          <span className="gold-gradient avatar-halo flex h-[104px] w-[104px] items-center justify-center rounded-full">
            <Star size={34} strokeWidth={0} fill="#17130A" />
          </span>
          <h1 className="mt-9 text-[36px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Back the network.
            <br />
            Get seen first.
          </h1>
          <p className="mt-4 max-w-[400px] text-[15px] leading-[1.55] text-secondary">
            Supporters keep onward/upward independent — and rise to the top of
            every search while they do it.
          </p>

          <ul className="mt-9 w-full max-w-[400px] space-y-3.5 text-left">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-[14.5px] text-body">
                <Check size={15} strokeWidth={2} className="mt-1 shrink-0 text-gold" />
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-baseline gap-2">
            <span className="text-[44px] font-black tracking-[-0.02em] text-cream">$4.99</span>
            <span className="text-[15px] text-secondary">/ month</span>
          </div>

          <form action={becomeSupporter} className="mt-7 w-full max-w-[400px]">
            <Cta type="submit">Become a Supporter</Cta>
          </form>
          <p className="mt-4 text-[12px] text-muted">Cancel anytime in Settings → Billing.</p>
        </main>
      </div>
    </PageFrame>
  );
}
