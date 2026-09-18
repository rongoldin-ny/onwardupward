"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera } from "lucide-react";
import Modal from "@/components/Modal";
import { WithCoachBadge } from "@/components/CoachBadge";
import { Avatar, Cta } from "@/components/ui";
import { FileListInput, RequiredPill, useEdit } from "./edit-context";

/** Avatar that becomes a tap-to-crop photo picker in edit mode. */
export default function PhotoField({
  id,
  current,
  required,
  isCoach = false,
}: {
  id: string;
  current: string | null;
  required: boolean;
  /** Live coach listing: badge the photo (view mode only). */
  isCoach?: boolean;
}) {
  const { editing, scheduleSave } = useEdit();
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const areaRef = useRef<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function confirmCrop() {
    if (!rawImage || !areaRef.current) return;
    const img = new Image();
    img.src = rawImage;
    await new Promise((resolve) => (img.onload = resolve));
    const { x, y, width, height } = areaRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext("2d")!.drawImage(img, x, y, width, height, 0, 0, 512, 512);
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9),
    );
    setCroppedFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    setCroppedUrl(URL.createObjectURL(blob));
    setRawImage(null);
    scheduleSave();
  }

  const preview = croppedUrl ?? current;

  if (!editing) {
    return (
      <WithCoachBadge show={isCoach}>
        <Avatar id={id} src={preview} size={132} halo />
      </WithCoachBadge>
    );
  }

  return (
    <div className="flex flex-col items-center lg:items-start">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Change photo"
        className="avatar-halo relative flex h-[132px] w-[132px] items-center justify-center overflow-hidden rounded-full border border-border-2 bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera size={30} strokeWidth={1.5} className="text-secondary" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-[11px] font-bold text-cream">
          {preview ? "Change" : "Add photo"}
        </span>
      </button>
      {required && !preview && (
        <span className="mt-3">
          <RequiredPill />
        </span>
      )}
      {croppedFile && <FileListInput files={[croppedFile]} name="photo" />}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            setRawImage(String(reader.result));
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />

      <Modal
        open={!!rawImage}
        onClose={() => setRawImage(null)}
        title="Frame your photo"
        maxWidth={382}
      >
        {rawImage && (
          <>
            <div className="relative h-[300px] overflow-hidden rounded-[20px]">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => (areaRef.current = pixels)}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="mt-5 w-full accent-[#E8C987]"
            />
            <div className="mt-4 flex gap-3">
              <Cta type="button" variant="secondary" onClick={() => setRawImage(null)}>
                Cancel
              </Cta>
              <Cta type="button" onClick={confirmCrop}>
                Use photo
              </Cta>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
