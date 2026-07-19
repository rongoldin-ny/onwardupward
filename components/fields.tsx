"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

export const inputClass =
  "h-[58px] w-full rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none";

export const textareaClass =
  "w-full resize-none rounded-[20px] border border-border-1 bg-surface-2 px-6 py-5 text-[15px] leading-[1.5] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none";

export function TextField({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${textareaClass} ${className}`} {...props} />;
}

export function SelectField({
  className = "",
  placeholder,
  options,
  ...props
}: {
  placeholder?: string;
  options: { value: string; label: string }[];
} & ComponentProps<"select">) {
  return (
    <div className={`relative ${className}`}>
      <select
        className={`${inputClass} appearance-none pr-12 ${
          props.value === "" || (props.defaultValue === "" && props.value === undefined)
            ? "text-muted"
            : ""
        }`}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-secondary"
      />
    </div>
  );
}

export { ROLE_TYPES, CAREER_STAGES, COUNTRIES } from "@/lib/taxonomy";
