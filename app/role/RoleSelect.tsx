"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { chooseRole } from "@/app/actions/auth";
import { Cta, Logo, PageFrame } from "@/components/ui";

const roles = [
  {
    id: "candidate",
    title: "Looking for a coach",
    description: "Build a profile that shows your best work — and connects you with coaches.",
  },
  {
    id: "coach",
    title: "Looking to coach others",
    description: "Join the bench — mentor designers and PMs from the network on your terms.",
  },
] as const;

export default function RoleSelect({ initial = "candidate" }: { initial?: "candidate" | "coach" }) {
  // Coming back from step 1 of onboarding, their earlier pick is preselected.
  const [selected, setSelected] = useState<"candidate" | "coach">(initial);
  const [pending, startTransition] = useTransition();

  return (
    <PageFrame size="narrow" centered>
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
      <header>
        <span className="md:hidden"><Logo /></span>
      </header>

      <main className="mt-[26%]">
        <h1 className="text-[38px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
          What brings you here?
        </h1>

        <div className="mt-9 space-y-4">
          {roles.map((role) => {
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={`w-full rounded-[20px] border bg-surface-2 p-5 text-left ${
                  isSelected ? "border-gold-active" : "border-border-1"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-[20px] font-black tracking-[-0.02em] text-cream">
                    {role.title}
                  </h2>
                  {isSelected && (
                    <span className="gold-gradient flex h-7 w-7 items-center justify-center rounded-full">
                      <Check size={15} strokeWidth={3} className="text-on-gold" />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[15px] leading-[1.5] text-secondary">
                  {role.description}
                </p>
              </button>
            );
          })}

        </div>
      </main>

      <footer className="mt-auto pt-10">
        <Cta
          disabled={pending}
          onClick={() => startTransition(() => chooseRole(selected))}
        >
          {pending ? "One moment…" : "Continue"}
        </Cta>
      </footer>
    </div>
    </PageFrame>
  );
}
