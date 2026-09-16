"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { setFeedbackResolved } from "@/app/actions/feedback";

export type FeedbackRow = {
  id: string;
  kind: "bug" | "feature";
  message: string;
  path: string | null;
  resolved: boolean;
  createdAt: string;
  by: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Wraps each CSV field in quotes and escapes embedded quotes. */
function csvField(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: FeedbackRow[]) {
  const header = ["Type", "Message", "Page", "By", "Resolved", "Submitted"];
  const lines = rows.map((r) =>
    [
      r.kind === "bug" ? "Bug" : "Feature idea",
      r.message,
      r.path ?? "",
      r.by ?? "Anonymous",
      r.resolved ? "Yes" : "No",
      formatDate(r.createdAt),
    ]
      .map(csvField)
      .join(","),
  );
  const csv = [header.map(csvField).join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy feedback text"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 text-secondary"
    >
      {copied ? (
        <Check size={15} strokeWidth={2} className="text-success" />
      ) : (
        <Copy size={15} strokeWidth={1.5} />
      )}
    </button>
  );
}

function ResolvedToggle({
  id,
  value,
  onChange,
}: {
  id: string;
  value: boolean;
  onChange: (resolved: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        const next = !value;
        onChange(next);
        setPending(true);
        const result = await setFeedbackResolved(id, next);
        setPending(false);
        if (result.error) onChange(!next);
      }}
      className={`eyebrow shrink-0 rounded-full border px-3 py-1.5 disabled:opacity-60 ${
        value ? "border-success/35 text-success" : "border-border-2 text-muted"
      }`}
    >
      {value ? "Resolved" : "Open"}
    </button>
  );
}

export default function FeedbackList({ rows: initialRows }: { rows: FeedbackRow[] }) {
  // Resolved items drop out of the list as soon as they're marked; the CSV
  // export still includes everything.
  const [rows, setRows] = useState(initialRows);
  const [showResolved, setShowResolved] = useState(false);
  const resolvedCount = rows.filter((r) => r.resolved).length;
  const visible = showResolved ? rows : rows.filter((r) => !r.resolved);
  const setResolved = (id: string, resolved: boolean) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, resolved } : r)));

  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-full border border-border-2 px-4 py-2 text-[13px] font-bold text-cream disabled:opacity-40"
        >
          <Download size={14} strokeWidth={1.5} />
          Download as CSV
        </button>
        {resolvedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="text-[13px] font-bold text-gold"
          >
            {showResolved ? "Hide resolved" : `Show resolved (${resolvedCount})`}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="rounded-[20px] border border-border-1 bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`eyebrow rounded-full border px-3 py-1.5 ${
                    r.kind === "bug"
                      ? "border-border-2 text-secondary"
                      : "border-gold-border text-gold"
                  }`}
                >
                  {r.kind === "bug" ? "Bug" : "Feature idea"}
                </span>
                <ResolvedToggle
                  id={r.id}
                  value={r.resolved}
                  onChange={(resolved) => setResolved(r.id, resolved)}
                />
              </div>
              <CopyButton text={r.message} />
            </div>
            <p className="mt-3 text-[14px] leading-[1.5] whitespace-pre-wrap text-body">
              {r.message}
            </p>
            <p className="mt-3 text-[12px] text-muted">
              {r.by ?? "Anonymous"} · {formatDate(r.createdAt)}
              {r.path && ` · ${r.path}`}
            </p>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="mt-2 text-[14px] text-secondary">
            {rows.length === 0 ? "No feedback yet." : "All caught up — nothing open."}
          </p>
        )}
      </div>
    </div>
  );
}
