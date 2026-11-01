"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { chooseRoles } from "@/app/actions/auth";
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

export type RoleChoice = (typeof roles)[number]["id"];

export default function RoleSelect({ initial }: { initial: RoleChoice[] }) {
  const [selected, setSelected] = useState<RoleChoice[]>(initial);
  const [pending, startTransition] = useTransition();

  const toggle = (id: RoleChoice) =>
    setSelected(selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id]);

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
        <p className="mt-3 text-[17px] text-secondary">Pick all that apply.</p>

        <div className="mt-9 space-y-4">
          {roles.map((role) => {
            const isSelected = selected.includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(role.id)}
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
          disabled={pending || selected.length === 0}
          className="disabled:opacity-40"
          onClick={() => startTransition(() => chooseRoles(selected))}
        >
          {pending ? "One moment…" : "Continue"}
        </Cta>
      </footer>
    </div>
    </PageFrame>
  );
}
