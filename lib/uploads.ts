import { isSafeUrl } from "./extract";
import { supabaseAdmin } from "./supabase/server";

const BUCKET = "profile-assets";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Persist an uploaded image to Supabase Storage under the owner's folder and
 * return its public URL. Callers have already authenticated the user.
 */
export async function saveImage(file: File, ownerId: string): Promise<string | null> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext || file.size === 0 || file.size > 10 * 1024 * 1024) return null;
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) {
    console.error("saveImage failed:", error.message);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Persist an uploaded PDF résumé and return its public URL. */
export async function saveResume(file: File, ownerId: string): Promise<string | null> {
  if (file.type !== "application/pdf" || file.size === 0 || file.size > 10 * 1024 * 1024) {
    return null;
  }
  const path = `${ownerId}/resume-${crypto.randomUUID()}.pdf`;
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: "application/pdf" });
  if (error) {
    console.error("saveResume failed:", error.message);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Mirror a remote image (e.g. one AI fill picked off the candidate's
 * portfolio) into our storage so profiles never hotlink external sites.
 * SSRF-guarded like every other user-supplied URL we fetch.
 */
export async function saveImageFromUrl(url: string, ownerId: string): Promise<string | null> {
  try {
    // Follow redirects manually so every hop passes the SSRF guard.
    let target = url;
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      if (!(await isSafeUrl(target))) return null;
      res = await fetch(target, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; OU-Importer/1.0)" },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return null;
        target = new URL(loc, target).href;
        continue;
      }
      break;
    }
    if (!res || !res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    // svg allowed on the mirror path only (our own generated logo cards) —
    // never for direct user uploads.
    const ext = EXT_BY_TYPE[type] ?? (type === "image/svg+xml" ? "svg" : undefined);
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 10 * 1024 * 1024) return null;
    const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
    const supabase = supabaseAdmin();
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: type });
    if (error) {
      console.error("saveImageFromUrl failed:", error.message);
      return null;
    }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
