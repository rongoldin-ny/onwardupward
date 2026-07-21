import { supabaseAdmin } from "./supabase/server";

/**
 * "My work" fallback for members without portfolios (PMs especially):
 * company logo on a colored background, generated as an SVG and stored in
 * our bucket so it behaves like any other portfolio image.
 */

const COLORS = ["#C9A35C", "#2E4B6B", "#3E5C4A", "#5C3E58", "#7A3B3B", "#2E6B62"];

function colorFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

async function fetchLogo(domain: string): Promise<{ b64: string; mime: string } | null> {
  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const mime = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim();
      if (!mime.startsWith("image/")) continue;
      const bytes = await res.arrayBuffer();
      if (bytes.byteLength < 200) continue; // tiny generic placeholder
      return { b64: Buffer.from(bytes).toString("base64"), mime };
    } catch {
      continue;
    }
  }
  return null;
}

export async function makeLogoCards(
  companies: string[],
  max = 3,
): Promise<{ url: string; company: string }[]> {
  const supabase = supabaseAdmin();
  const out: { url: string; company: string }[] = [];

  for (const company of companies.slice(0, max)) {
    const domain = `${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const logo = await fetchLogo(domain);
    if (!logo) continue;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750"><rect width="1200" height="750" fill="${colorFor(company)}"/><rect x="440" y="215" width="320" height="320" rx="48" fill="rgba(255,255,255,0.92)"/><image href="data:${logo.mime};base64,${logo.b64}" x="504" y="279" width="192" height="192" preserveAspectRatio="xMidYMid meet"/></svg>`;
    const path = `logo-cards/${crypto.randomUUID()}.svg`;
    const { error } = await supabase.storage
      .from("profile-assets")
      .upload(path, Buffer.from(svg), { contentType: "image/svg+xml" });
    if (error) continue;
    out.push({
      url: supabase.storage.from("profile-assets").getPublicUrl(path).data.publicUrl,
      company,
    });
  }
  return out;
}
