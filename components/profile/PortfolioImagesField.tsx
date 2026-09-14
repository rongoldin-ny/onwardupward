"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import type { PortfolioImage } from "@/lib/db";
import { FileListInput, smallInputClass, useEdit } from "./edit-context";

export type WorkImageItem = {
  url?: string; // already in storage
  remoteUrl?: string; // AI-picked image still on the candidate's own site
  file?: File; // freshly picked
  preview: string;
  company: string;
  caption: string;
  year: string;
};

export function itemsFromImages(images: PortfolioImage[]): WorkImageItem[] {
  return images.map((img) => ({
    url: img.url,
    preview: img.url,
    company: img.company ?? "",
    caption: img.caption ?? "",
    year: img.year ?? "",
  }));
}

/**
 * The server saves kept → remote → new, in that order, and returns the
 * stored list; swap in the storage urls so the next autosave doesn't
 * re-upload. Bails if the counts drifted (a save raced an edit).
 */
export function commitSavedItems(cur: WorkImageItem[], saved: PortfolioImage[]): WorkImageItem[] {
  const ordered = [
    ...cur.filter((i) => i.url),
    ...cur.filter((i) => i.remoteUrl),
    ...cur.filter((i) => i.file),
  ];
  if (ordered.length !== saved.length) return cur;
  return ordered.map((item, i) => ({
    url: saved[i].url,
    preview: saved[i].url,
    company: item.company,
    caption: item.caption,
    year: item.year,
  }));
}

/** Image list editor; state lives in the parent so it survives view/edit toggles. */
export default function PortfolioImagesField({
  items,
  onChange,
}: {
  items: WorkImageItem[];
  onChange: (next: WorkImageItem[]) => void;
}) {
  const { scheduleSave } = useEdit();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef<number>(-1);

  const keptItems = items.filter((i) => i.url);
  const remoteItems = items.filter((i) => i.remoteUrl);
  const newItems = items.filter((i) => i.file);
  const meta = [...keptItems, ...remoteItems, ...newItems].map(({ company, caption, year }) => ({
    company,
    caption,
    year,
  }));

  const update = (next: WorkImageItem[]) => {
    onChange(next);
    scheduleSave();
  };
  const patch = (index: number, changes: Partial<WorkImageItem>) =>
    update(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={item.url ?? item.remoteUrl ?? `new-${i}-${item.file?.name}`}
          className="relative rounded-[20px] border border-border-1 bg-surface-1 p-4"
        >
          <button
            type="button"
            onClick={() => update(items.filter((_, j) => j !== i))}
            aria-label="Remove image"
            className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-secondary"
          >
            <X size={13} strokeWidth={2} />
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                replaceIndex.current = i;
                replaceRef.current?.click();
              }}
              aria-label="Replace image"
              className="group relative shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" className="h-[104px] w-[104px] rounded-xl object-cover" />
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <ImagePlus size={18} strokeWidth={1.5} className="text-cream" />
              </span>
            </button>
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex gap-2.5">
                <input
                  value={item.company}
                  onChange={(e) => patch(i, { company: e.target.value })}
                  placeholder="Company"
                  className={`${smallInputClass} flex-1`}
                />
                <input
                  value={item.year}
                  onChange={(e) =>
                    patch(i, { year: e.target.value.replace(/\D/g, "").slice(0, 4) })
                  }
                  placeholder="Year"
                  inputMode="numeric"
                  className={`${smallInputClass} w-[76px] shrink-0`}
                />
              </div>
              <input
                value={item.caption}
                onChange={(e) => patch(i, { caption: e.target.value })}
                placeholder="Caption — what is this?"
                className={`${smallInputClass} w-full`}
              />
            </div>
          </div>
        </div>
      ))}
      {items.length < 10 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-[64px] w-full items-center justify-center gap-3 rounded-[20px] border border-dashed border-border-2 text-[14px] text-secondary"
        >
          <ImagePlus size={18} strokeWidth={1.5} />
          Add images
        </button>
      )}
      {keptItems.map((item) => (
        <input key={item.url} type="hidden" name="existing_images" value={item.url} />
      ))}
      {remoteItems.map((item) => (
        <input key={item.remoteUrl} type="hidden" name="remote_images" value={item.remoteUrl} />
      ))}
      <input type="hidden" name="images_meta" value={JSON.stringify(meta)} />
      <FileListInput files={newItems.map((i) => i.file!)} name="images" />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const room = 10 - items.length;
          update([
            ...items,
            ...files.slice(0, room).map((file) => ({
              file,
              preview: URL.createObjectURL(file),
              company: "",
              caption: "",
              year: "",
            })),
          ]);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const i = replaceIndex.current;
          if (file && i >= 0) {
            patch(i, { file, url: undefined, remoteUrl: undefined, preview: URL.createObjectURL(file) });
          }
          e.target.value = "";
          replaceIndex.current = -1;
        }}
      />
    </div>
  );
}
