"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera } from "lucide-react";
import { savePhoto } from "@/app/actions/onboarding";
import { Cta } from "@/components/ui";

function FileListInput({ files, name }: { files: File[]; name: string }) {
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

export default function PhotoForm({ currentPhoto }: { currentPhoto: string | null }) {
  const router = useRouter();
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const areaRef = useRef<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await savePhoto(formData);
      if (result.error) setError(result.error);
      else router.push("/settings");
    });
  }

  const preview = croppedUrl ?? currentPhoto;

  return (
    <form ref={formRef} onSubmit={submit} className="flex flex-1 flex-col items-center">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="avatar-halo relative flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-full border border-border-2 bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <Camera size={36} strokeWidth={1.5} className="text-secondary" />
        )}
      </button>
      <p className="mt-5 text-[13px] text-secondary">
        {preview ? "Tap to choose a different photo." : "Tap to add a photo."}
      </p>
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

      {error && <p className="mt-6 text-[14px] text-gold">{error}</p>}
      <div className="mt-auto w-full pt-10">
        <Cta type="submit" disabled={pending || !croppedFile}>
          {pending ? "Saving…" : "Save photo"}
        </Cta>
      </div>

      {rawImage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,10,12,0.85)] px-6">
          <div className="w-full max-w-[382px] rounded-[28px] border border-gold-border bg-surface-2 p-5">
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-cream">
              Frame your photo
            </h2>
            <div className="relative mt-4 h-[300px] overflow-hidden rounded-[20px]">
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
          </div>
        </div>
      )}
    </form>
  );
}
