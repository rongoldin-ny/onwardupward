"use client";

import { useState } from "react";
import { textareaClass } from "@/components/fields";
import { Cta } from "@/components/ui";

/**
 * Approve / Reject for an admin review queue (waitlist members, coaches,
 * claims). Reject reveals an optional note that's included in the
 * rejection email — kept collapsed by default so it doesn't compete with
 * Approve as the default action.
 */
export default function ReviewActions({
  approveAction,
  rejectAction,
  approveLabel = "Approve",
}: {
  approveAction: () => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
  approveLabel?: string;
}) {
  const [rejecting, setRejecting] = useState(false);

  if (rejecting) {
    return (
      <form action={rejectAction} className="mt-4 space-y-2.5">
        <textarea
          name="note"
          rows={3}
          placeholder="Optional note to include in the rejection email…"
          className={`${textareaClass} !rounded-[16px] !px-4 !py-3 text-[13.5px]`}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="h-[42px] flex-1 rounded-full border border-border-2 text-[13.5px] font-bold text-cream"
          >
            Send rejection
          </button>
          <button
            type="button"
            onClick={() => setRejecting(false)}
            className="h-[42px] rounded-full px-4 text-[13.5px] text-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex gap-2">
      <form action={approveAction} className="flex-1">
        <Cta type="submit" className="!h-[46px] text-[14px]">
          {approveLabel}
        </Cta>
      </form>
      <button
        type="button"
        onClick={() => setRejecting(true)}
        className="h-[46px] shrink-0 rounded-full border border-border-2 px-5 text-[14px] font-bold text-secondary"
      >
        Reject
      </button>
    </div>
  );
}
