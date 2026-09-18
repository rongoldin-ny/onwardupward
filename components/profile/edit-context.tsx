"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";

export type Viewer = "owner" | "member" | "public";
export type TrackedElement = "linkedin" | "reference" | "portfolio" | "contact";

export type EditState = {
  editing: boolean;
  viewer: Viewer;
  scheduleSave: () => void;
  track: (element: TrackedElement) => void;
};

export const EditContext = createContext<EditState>({
  editing: false,
  viewer: "public",
  scheduleSave: () => {},
  track: () => {},
});

export const useEdit = () => useContext(EditContext);

export function RequiredPill() {
  return (
    <span className="eyebrow rounded-full border border-gold-border px-2 py-1 text-[9px] text-gold">
      required
    </span>
  );
}

export function Labeled({
  label,
  pill,
  children,
}: {
  label: string;
  pill?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="eyebrow text-secondary">{label}</p>
        {pill}
      </div>
      {children}
    </div>
  );
}

export function CardSection({
  title,
  pill,
  children,
}: {
  title: string;
  pill?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border-1 pt-5">
      {/* Wraps because a pill can be a disclosure that opens a full-width
          panel beneath the title (see CertificationInfo). */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow text-secondary">{title}</p>
        {pill}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export const chipClass = (on: boolean) =>
  `rounded-full border px-4 py-2.5 text-[13px] ${
    on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
  }`;

export const smallInputClass =
  "h-[42px] min-w-0 rounded-full border border-border-1 bg-surface-1 px-4 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none";

/** Mirrors a File[] held in React state into the form via a hidden input's FileList. */
export function FileListInput({ files, name }: { files: File[]; name: string }) {
  const ref = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node) return;
      const dt = new DataTransfer();
      for (const f of files) dt.items.add(f);
      node.files = dt.files;
    },
    [files],
  );
  return <input ref={ref} type="file" name={name} multiple className="hidden" />;
}

/** Grow a textarea to fit its content as the user types. */
export function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
  const t = e.currentTarget;
  t.style.height = "auto";
  t.style.height = `${t.scrollHeight}px`;
}
