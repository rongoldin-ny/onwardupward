import { redirect } from "next/navigation";
import { Check, Sparkle } from "lucide-react";
import { requireUser, homeFor } from "@/lib/auth";
import { subscribe } from "@/app/actions/onboarding";
import { Cta, Logo, PageFrame } from "@/components/ui";

const perks = [
  "Unlimited AI-powered search",
  "Full profiles, portfolios & references",
  "Direct contact with candidates",
];

export default async function Subscribe() {
  const user = await requireUser();
  if (user.role !== "recruiter" || user.is_paid) redirect(homeFor(user));
  if (!user.onboarding_complete) redirect("/onboarding");

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
      <div className="hero-glow" />
      <header>
        <Logo />
      </header>

      <main className="mt-14 flex flex-col items-center text-center">
        <span className="gold-gradient avatar-halo flex h-[104px] w-[104px] items-center justify-center rounded-full">
          <Sparkle size={34} strokeWidth={0} fill="#17130A" className="text-on-gold" />
        </span>
        <h1 className="mt-9 text-[36px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
          Access O&amp;U&apos;s talent network
        </h1>
        <p className="mt-4 max-w-[300px] text-[17px] leading-[1.5] text-secondary">
          Every profile is vetted. Every search reads between the lines.
        </p>

        <ul className="mt-10 w-full text-left">
          {perks.map((perk, i) => (
            <li
              key={perk}
              className={`flex items-center gap-4 py-4 ${
                i > 0 ? "border-t border-border-1" : ""
              }`}
            >
              <Check size={18} strokeWidth={2} className="shrink-0 text-gold" />
              <span className="text-[16px] text-body">{perk}</span>
            </li>
          ))}
        </ul>
      </main>

      <footer className="mt-auto pt-10">
        <form action={subscribe}>
          <Cta type="submit">Subscribe — $199/mo</Cta>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted">Cancel anytime.</p>
      </footer>
    </div>
    </PageFrame>
  );
}
