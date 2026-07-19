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
