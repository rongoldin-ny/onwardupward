import { extractText, getDocumentProxy } from "unpdf";

/** Pull plain text out of a PDF résumé; null when unreadable. */
export async function resumeTextFromBytes(bytes: ArrayBuffer): Promise<string | null> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    const clean = String(text).replace(/\s+/g, " ").trim().slice(0, 20_000);
    return clean || null;
  } catch (e) {
    console.error("resume parse failed:", e);
    return null;
  }
}

/** Fetch a stored résumé (our own storage URL) and extract its text. */
export async function resumeTextFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return await resumeTextFromBytes(await res.arrayBuffer());
  } catch {
    return null;
  }
}
