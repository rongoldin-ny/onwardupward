import { COUNTRIES, INDUSTRIES } from "./taxonomy";

/**
 * Best-effort profile extraction from a portfolio site (import-first
 * onboarding). Fetches the page server-side and pulls what it can from
 * meta tags, headings, and visible text. Everything here is a heuristic —
 * the wizard always shows the results for the candidate to edit.
 */

export type ExtractedProfile = {
  name?: string;
  bio?: string;
  roleType?: string;
  careerStage?: string;
  city?: string;
  country?: string;
  yearsExperience?: number;
  industries: string[];
  work: { title: string; company: string }[];
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 800_000;

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * SSRF guard: we fetch user-supplied URLs server-side, so refuse anything
 * that resolves to private, loopback, or link-local (cloud metadata) space.
 * Redirects are followed manually so every hop is re-checked.
 * Localhost is allowed only outside production (demo pages live there in dev).
 */
async function isSafeUrl(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();

  const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (isLocalhost) return process.env.NODE_ENV !== "production";

  const { lookup } = await import("dns/promises");
  let addresses;
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    return false;
  }
  const privateV4 =
    /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;
  for (const { address, family } of addresses) {
    if (family === 4 && privateV4.test(address)) return false;
    if (family === 6) {
      const a = address.toLowerCase();
      if (a === "::1" || a.startsWith("fe80") || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("::ffff:"))
        return false;
    }
  }
  return true;
}

async function fetchHtml(
  url: string,
  init: RequestInit = {},
): Promise<{ html: string; setCookies: string[] } | null> {
  try {
    let current = url;
    for (let hop = 0; hop < 4; hop++) {
      if (!(await isSafeUrl(current))) return null;
      const res = await fetch(current, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        ...init,
        redirect: "manual",
        headers: {
          "User-Agent": "OU-profile-import/1.0",
          Accept: "text/html",
          ...(init.headers ?? {}),
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return null;
        current = new URL(location, current).href;
        // Redirect targets are fetched as GET without the original body.
        init = { ...init, method: "GET", body: undefined };
        continue;
      }
      if (!res.ok) return null;
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("html")) return null;
      const html = (await res.text()).slice(0, MAX_BYTES);
      return { html, setCookies: res.headers.getSetCookie?.() ?? [] };
    }
    return null;
  } catch {
    return null;
  }
}

function isPasswordGate(html: string): boolean {
  return /<input[^>]+type=["']password["']/i.test(html);
}

/**
 * Best-effort unlock of a password-protected portfolio: find the password
 * form, POST the password along with any hidden fields, carry cookies the
 * gate sets, and fetch the unlocked page.
 */
async function unlockWithPassword(
  pageUrl: string,
  html: string,
  password: string,
): Promise<string | null> {
  const formMatch = html.match(/<form[\s\S]*?<\/form>/gi)?.find((f) => isPasswordGate(f));
  if (!formMatch) return null;

  const actionRaw = formMatch.match(/<form[^>]+action=["']([^"']*)["']/i)?.[1] ?? "";
  const action = actionRaw ? new URL(actionRaw, pageUrl).href : pageUrl;
  const passwordField =
    formMatch.match(/<input[^>]+type=["']password["'][^>]*name=["']([^"']+)["']/i)?.[1] ??
    formMatch.match(/<input[^>]*name=["']([^"']+)["'][^>]+type=["']password["']/i)?.[1] ??
    "password";

  const body = new URLSearchParams();
  // Preserve hidden fields (CSRF tokens etc.)
  for (const input of formMatch.matchAll(
    /<input[^>]+type=["']hidden["'][^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["']/gi,
  )) {
    body.set(input[1], input[2]);
  }
  body.set(passwordField, password);

  const submitted = await fetchHtml(action, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!submitted) return null;

  // If the POST response is still the gate, retry the page with any session
  // cookie the gate handed back.
  if (!isPasswordGate(submitted.html)) return submitted.html;
  if (submitted.setCookies.length > 0) {
    const cookie = submitted.setCookies.map((c) => c.split(";")[0]).join("; ");
    const retried = await fetchHtml(pageUrl, { headers: { Cookie: cookie } });
    if (retried && !isPasswordGate(retried.html)) return retried.html;
  }
  return null;
}

export async function fetchPortfolioHtml(
  url: string,
  password?: string | null,
): Promise<string | null> {
  const page = await fetchHtml(url);
  if (!page) return null;
  if (isPasswordGate(page.html) && password) {
    const unlocked = await unlockWithPassword(url, page.html, password);
    if (unlocked) return unlocked;
  }
  return page.html;
}

function meta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1].trim());
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).slice(0, 20_000);
}

/** "Maya Lindqvist — Product Designer" → "Maya Lindqvist" */
function nameFromTitle(title: string): string | null {
  const first = title.split(/[|·—–\-:]/)[0].trim();
  // A plausible person name: 2–3 capitalized words, no digits.
  if (/^[A-ZÀ-Þ][\wÀ-ÿ'.]+(?: [A-ZÀ-Þ][\wÀ-ÿ'.]+){1,2}$/.test(first)) return first;
  return null;
}

const ROLE_PATTERNS: [RegExp, string][] = [
  [/design (?:director|lead(?:er)?ship)|head of design|vp,? design|design manager/i, "design_management"],
  [/content design/i, "content_designer"],
  [/(?:ux|user|design) research/i, "ux_researcher"],
  [/product manager|product management/i, "pm_ic"],
  [/product designer|ux\/ui designer|ui\/ux designer|digital product designer|interaction designer/i, "designer"],
];

const STAGE_PATTERNS: [RegExp, string][] = [
  [/\b(?:director|head of|vp\b|vice president|chief design)/i, "director"],
  [/\b(?:staff|principal)\b/i, "senior"],
  [/\bsenior\b/i, "senior"],
  [/\blead\b/i, "senior"],
];

const TITLE_WORDS =
  "(?:Staff |Senior |Principal |Lead |Founding )?(?:Product |UX |UI |Content |Interaction )?(?:Designer|Design Director|Design Manager|Design Lead|Researcher|Product Manager)";

export function extractProfile(html: string): ExtractedProfile {
  const text = visibleText(html);
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

  const name =
    (meta(html, "og:site_name") && nameFromTitle(meta(html, "og:site_name")!)) ||
    nameFromTitle(decodeEntities(title)) ||
    nameFromTitle(decodeEntities(h1)) ||
    undefined;

  const bio = meta(html, "description") ?? meta(html, "og:description") ?? undefined;

  const searchable = `${title} ${h1} ${bio ?? ""} ${text}`;
  const roleType = ROLE_PATTERNS.find(([re]) => re.test(searchable))?.[1];
  const careerStage = STAGE_PATTERNS.find(([re]) => re.test(searchable))?.[1] ?? (roleType ? "mid" : undefined);

  // "based in Copenhagen, Denmark" / "living in London"
  let city: string | undefined;
  let country: string | undefined;
  const loc = searchable.match(
    /(?:based|living|working) in ([A-ZÀ-Þ][\wÀ-ÿ]+(?: [A-ZÀ-Þ][\wÀ-ÿ]+)?)(?:,\s*([A-ZÀ-Þ][\wÀ-ÿ]+(?: [A-ZÀ-Þ][\wÀ-ÿ]+)?))?/,
  );
  if (loc) {
    city = loc[1];
    country = loc[2];
  }
  if (!country) {
    country = COUNTRIES.map((c) => c.value).find((c) => searchable.includes(c));
  }

  // "12 years", "12+ years of experience", "over a decade", "two decades"
  let yearsExperience: number | undefined;
  const numericYears = searchable.match(/(\d{1,2})\+?\s*years?(?:\s+of)?(?:\s+(?:experience|design|designing|product))?/i);
  if (numericYears) {
    const n = parseInt(numericYears[1], 10);
    if (n >= 1 && n <= 40) yearsExperience = n;
  }
  if (!yearsExperience) {
    if (/two decades/i.test(searchable)) yearsExperience = 20;
    else if (/(?:a|one) decade|over a decade/i.test(searchable)) yearsExperience = 10;
  }

  // Industries: canonical labels from the taxonomy, matched against page text.
  const INDUSTRY_MATCHERS: [RegExp, string][] = [
    [/fintech|banking|financial services|lending|investing/i, "Fintech"],
    [/payments?|checkout|wallets?|point of sale/i, "Payments"],
    [/\bb2b\b/i, "B2B"],
    [/\bsaas\b/i, "SaaS"],
    [/consumer (?:apps?|products?|banking|investing|tech)|\bb2c\b/i, "Consumer"],
    [/e-?commerce|online (?:shopping|store)|\bdtc\b|direct.to.consumer/i, "E-commerce"],
    [/\bretail\b|in-?store|brick.and.mortar|grocery/i, "Retail"],
    [/(?:two-?sided )?marketplaces?/i, "Marketplaces"],
    [/food|beverage|restaurants?|dining|delivery|coffee|drinks?|\beats\b/i, "Food & Beverage"],
    [/hardware|\bdevices?\b|\biot\b|connected devices|robotics/i, "Hardware"],
    [/wearables?|smart ?watch|fitness trackers?|\bband\b/i, "Wearables"],
    [/\bsearch\b|discovery|recommendations?/i, "Search"],
    [/\bAI\b|machine learning|artificial intelligence|\bLLMs?\b|gen(?:erative)? ?ai/i, "AI"],
    [/health(?:care| ?tech)|medical|telehealth|pharma/i, "Healthcare"],
    [/fitness|wellness|workouts?/i, "Fitness"],
    [/enterprise/i, "Enterprise"],
    [/productivity|collaboration tools?|workflow/i, "Productivity"],
    [/developer tools?|dev ?tools|\bapis?\b|developer platform/i, "Developer Tools"],
    [/social (?:network|apps?|platform|media)|messaging|communit(?:y|ies)/i, "Social"],
    [/\bmedia\b|streaming|entertainment|publishing/i, "Media"],
    [/gaming|video ?games?|esports/i, "Gaming"],
    [/\bmusic\b|\baudio\b|podcasts?/i, "Music"],
    [/travel|hotels?|flights?|hospitality|booking/i, "Travel"],
    [/mobility|ride-?shar|automotive|scooters?|transit/i, "Mobility"],
    [/logistics|shipping|supply chain|last.mile|fulfillment/i, "Logistics"],
    [/real estate|proptech|housing/i, "Real Estate"],
    [/insurance|insurtech/i, "Insurance"],
    [/crypto|web3|blockchain/i, "Crypto"],
    [/edtech|education|learning platform/i, "Edtech"],
  ];

  // Well-known employers imply industries even when the page never names them.
  const COMPANY_INDUSTRY_HINTS: [RegExp, string[]][] = [
    [/uber eats|doordash|deliveroo|instacart|grubhub/i, ["Food & Beverage", "Marketplaces"]],
    [/\buber\b|\blyft\b/i, ["Mobility", "Marketplaces"]],
    [/airbnb|booking\.com|expedia/i, ["Travel", "Marketplaces"]],
    [/\bapple\b|\bsamsung\b|\bsonos\b|\bdyson\b/i, ["Hardware", "Consumer"]],
    [/fitbit|garmin|whoop|oura/i, ["Wearables", "Fitness"]],
    [/\bgoogle\b|\bbing\b|algolia/i, ["Search"]],
    [/paypal|stripe|square\b|adyen|klarna|venmo/i, ["Fintech", "Payments"]],
    [/shopify|amazon|walmart|target|etsy|ebay/i, ["E-commerce", "Retail"]],
    [/spotify|soundcloud|tidal/i, ["Music", "Consumer"]],
    [/netflix|hulu|disney/i, ["Media", "Consumer"]],
  ];

  const industrySet = new Set<string>();
  for (const [re, label] of INDUSTRY_MATCHERS) {
    if (re.test(searchable)) industrySet.add(label);
  }
  for (const [re, labels] of COMPANY_INDUSTRY_HINTS) {
    if (re.test(searchable)) labels.forEach((l) => industrySet.add(l));
  }
  const industries = [...industrySet].filter((l) => INDUSTRIES.includes(l)).slice(0, 15);

  // Work history: "Product Designer at Stripe", "Design Lead @ Canva"
  const work: { title: string; company: string }[] = [];
  const seen = new Set<string>();
  // Company: capitalized word(s), optionally a lowercase domain suffix ("Read.cv"),
  // never crossing a sentence boundary.
  const workRe = new RegExp(
    `(${TITLE_WORDS})\\s*(?:at|@)\\s+([A-Z][A-Za-z0-9&]+(?:\\.[a-z]{2,3})?(?: [A-Z][A-Za-z0-9&]+)?)`,
    "g",
  );
  for (const m of searchable.matchAll(workRe)) {
    const company = m[2].replace(/[.,]$/, "");
    const key = company.toLowerCase();
    if (seen.has(key) || work.length >= 3) continue;
    seen.add(key);
    work.push({ title: m[1].trim(), company });
  }

  return { name, bio, roleType, careerStage, city, country, yearsExperience, industries, work };
}
