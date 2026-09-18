"use client";

import { useId, useState } from "react";
import { Info, X } from "lucide-react";

/**
 * The (i) beside "Certification", on the listing form and on the coach's page.
 *
 * A disclosure rather than a hover tooltip: this is three paragraphs of real
 * definition, and a tooltip has nowhere to go on a phone. It expands in the
 * page flow so nothing is overlaid and nothing is clipped.
 */
export default function CertificationInfo() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Hide what these mean" : "What do these mean?"}
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-2 text-secondary"
      >
        <Info size={13} strokeWidth={2} />
      </button>
      {open && (
        <div
          id={panelId}
          className="order-last mt-3.5 w-full rounded-[16px] border border-border-1 bg-surface-1 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-bold text-cream">Mentor or coach?</p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="-m-1 shrink-0 p-1 text-secondary"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-2.5 text-[13px] leading-[1.55] text-body-2">
            A <strong className="text-body">mentor</strong> offers long-term,
            relationship-driven guidance — sharing personal wisdom and advice to support overall
            career growth, based on deep expertise in an industry or field.
          </p>
          <p className="mt-2.5 text-[13px] leading-[1.55] text-body-2">
            A <strong className="text-body">coach</strong> uses structured, question-based
            methods to help someone improve specific performance goals, building awareness and
            behaviour change over the short term. Coaches hold various certifications, including:
          </p>
          <ul className="mt-2.5 space-y-2 text-[13px] leading-[1.55] text-body-2">
            <li>
              <strong className="text-body">Associate Certified Coach (ICF ACC — Level 1):</strong>{" "}
              60+ hours of education, 100+ hours of coaching experience, and 10 hours of mentor
              coaching.
            </li>
            <li>
              <strong className="text-body">Professional Certified Coach (ICF PCC — Level 2):</strong>{" "}
              125+ hours of education, 500+ hours of coaching experience, and 10 hours of mentor
              coaching.
            </li>
            <li>
              <strong className="text-body">Master Certified Coach (ICF MCC — Level 3):</strong>{" "}
              requires a prior PCC, 200+ hours of education, and 2,500+ hours of coaching
              experience.
            </li>
          </ul>
          <p className="mt-2.5 text-[13px] leading-[1.55] text-body-2">
            Many universities (NYU and Columbia among them) and training institutes offer their own
            certifications while providing the education and mentor coaching an ICF credential
            requires. Some coaches hold both an institute designation and an ICF credential.
          </p>
        </div>
      )}
    </>
  );
}
