"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import Modal from "@/components/Modal";

/**
 * The (i) beside "Certification", on the listing form and on the coach's page.
 * Three paragraphs of real definition, so it opens the shared Modal rather
 * than a tooltip — there's nowhere for hover to go on a phone anyway.
 */
export default function CertificationInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="What do these mean?"
        onClick={() => setOpen(true)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-2 text-secondary"
      >
        <Info size={13} strokeWidth={2} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Mentor or coach?">
        <p className="text-[14px] leading-[1.6] text-body-2">
          A <strong className="text-body">mentor</strong> offers long-term, relationship-driven
          guidance — sharing personal wisdom and advice to support overall career growth, based on
          deep expertise in an industry or field.
        </p>
        <p className="mt-3 text-[14px] leading-[1.6] text-body-2">
          A <strong className="text-body">coach</strong> uses structured, question-based methods to
          help someone improve specific performance goals, building awareness and behaviour change
          over the short term. Coaches hold various certifications, including:
        </p>
        <ul className="mt-3 space-y-2.5 text-[14px] leading-[1.6] text-body-2">
          <li>
            <strong className="text-body">Associate Certified Coach (ICF ACC — Level 1):</strong> 60+
            hours of education, 100+ hours of coaching experience, and 10 hours of mentor coaching.
          </li>
          <li>
            <strong className="text-body">Professional Certified Coach (ICF PCC — Level 2):</strong>{" "}
            125+ hours of education, 500+ hours of coaching experience, and 10 hours of mentor
            coaching.
          </li>
          <li>
            <strong className="text-body">Master Certified Coach (ICF MCC — Level 3):</strong>{" "}
            requires a prior PCC, 200+ hours of education, and 2,500+ hours of coaching experience.
          </li>
        </ul>
        <p className="mt-3 text-[14px] leading-[1.6] text-body-2">
          Many universities (NYU and Columbia among them) and training institutes offer their own
          certifications while providing the education and mentor coaching an ICF credential
          requires. Some coaches hold both an institute designation and an ICF credential.
        </p>
      </Modal>
    </>
  );
}
