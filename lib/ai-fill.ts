import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fetchPortfolioHtml, visibleText } from "./extract";
import { makeLogoCards } from "./logo-card";
import { CAREER_STAGES, COUNTRIES, ROLE_TYPES, uniqueCompanies } from "./taxonomy";

/**
 * "Fill with AI" — Claude reads the candidate's portfolio (and LinkedIn when
 * it's publicly reachable) and proposes values for every profile field.
 * Nothing is written to the database here; the settings form shows the
 * proposal for review and the normal Save persists it.
 *
 * Deliberately never proposes dream_job — the ideal-next-role prompt is the
 * candidate's own voice, not something to infer.
 */

const roleValues = ROLE_TYPES.map((r) => r.value) as [string, ...string[]];
const stageValues = CAREER_STAGES.map((s) => s.value) as [string, ...string[]];
const countryValues = COUNTRIES.map((c) => c.value) as [string, ...string[]];

const AiFill = z.object({
  name: z.string().nullable().describe("The candidate's full name"),
  role_type: z.enum(roleValues).nullable().describe("Their role type"),
  career_stage: z.enum(stageValues).nullable().describe("Their career stage"),
  location_country: z.enum(countryValues).nullable(),
  location_state: z.string().nullable().describe("State or province, if evident"),
  location_city: z.string().nullable(),
  years_experience: z.number().int().min(0).max(60).nullable(),
  industries: z
    .array(z.string())
    .describe("Industries they've worked in — infer from employers and projects"),
  bio: z
    .string()
    .nullable()
    .describe("A first-person 2-4 sentence bio in their own voice, grounded in the site copy"),
  last_role_text: z
    .string()
    .nullable()
    .describe("2-3 first-person sentences about their most recent role and what they're proud of"),
  brags: z
    .array(z.string())
    .max(5)
    .describe(
      "Up to five concrete career highlights. Prioritize major releases and launches; state the metric or business outcome whenever the material gives one",
    ),
  work: z
    .array(z.object({ title: z.string(), company: z.string() }))
    .max(3)
    .describe("Their last three jobs, most recent first"),
  photo_url: z
    .string()
    .nullable()
    .describe(
      "The candidate's own headshot or portrait photo — must be a url copied exactly from the numbered image list; null if none is clearly them",
    ),
  images: z
    .array(
      z.object({
        url: z.string().describe("Must be a url copied exactly from the numbered image list"),
        company: z.string().describe("The company or client the project was for"),
        year: z.string().nullable().describe("4-digit year of the project, if determinable"),
        caption: z.string().describe("One short line: what this shows and why it matters"),
      }),
    )
    .max(6)
    .describe("The strongest portfolio images, best first"),
  references: z
    .array(
      z.object({
        full_name: z.string(),
        current_title: z.string().nullable(),
        linkedin_url: z.string().nullable(),
      }),
    )
    .max(3)
    .describe(
      "People who vouch for the candidate — ONLY from LinkedIn recommendations or explicit testimonials with a named author; never guessed",
    ),
});

export type AiFillResult = z.infer<typeof AiFill>;

/** LinkedIn usually authwalls bots — only pass along pages with real content. */
function usableLinkedInText(html: string | null): string | null {
  if (!html) return null;
  if (/authwall|join linkedin|sign in to view/i.test(html.slice(0, 5000))) return null;
  const text = visibleText(html);
  return text.length > 1500 ? text : null;
}

/**
 * Pull candidate <img> urls out of the portfolio for Claude to choose from.
 * Urls are often opaque hashes (Framer, Squarespace…) with empty alt text, so
 * each image also carries the visible text around it in the document — that
 * context is what lets the model match an image to the right project.
 */
function collectImages(
  html: string,
  baseUrl: string,
): { url: string; alt: string; context: string }[] {
  const out: { url: string; alt: string; context: string }[] = [];
  const seen = new Set<string>();
  // Strip script/style blocks up front — a context window sliced mid-block
  // would otherwise leak raw CSS/JS into the "nearby text".
  const doc = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc)) !== null) {
    const tag = m[0];
    const rawSrc = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!rawSrc || rawSrc.startsWith("data:")) continue;
    // Attribute values HTML-encode ampersands; decode so the url is fetchable
    // and matches how the model echoes it back.
    const src = rawSrc.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&");
    let abs: string;
    try {
      abs = new URL(src, baseUrl).href;
    } catch {
      continue;
    }
    if (!/^https?:/.test(abs)) continue;
    if (/\.(svg|ico)(\?|$)/i.test(abs)) continue; // logos and favicons, not work
    if (seen.has(abs)) continue;
    seen.add(abs);
    // Markup-heavy builders (Framer etc.) need a wide slice to yield any
    // text. Trim the window to tag boundaries so partial tags at the edges
    // don't leak attribute soup into the extracted text.
    let before = doc.slice(Math.max(0, m.index - 2500), m.index);
    before = before.slice(before.indexOf(">") + 1);
    // Card layouts often put the project name/description well after the
    // image in source order — a long trailing window catches it.
    let after = doc.slice(m.index + tag.length, m.index + tag.length + 8000);
    const lastLt = after.lastIndexOf("<");
    if (lastLt !== -1 && after.indexOf(">", lastLt) === -1) after = after.slice(0, lastLt);
    const context = visibleText(`${before} ⟪this image⟫ ${after}`).trim().slice(0, 300);
    out.push({ url: abs, alt: tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "", context });
    if (out.length >= 40) break;
  }
  return out;
}

/**
 * Find worthwhile subpage urls on the candidate's own site: about/bio pages
 * (headshots, bio copy) and project/case-study pages (the actual work — many
 * portfolios keep the home page image-free).
 */
function subpageUrls(html: string, baseUrl: string): string[] {
  const about: string[] = [];
  const work: string[] = [];
  const base = new URL(baseUrl);
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#?]+)["']/gi)) {
    let href: URL;
    try {
      href = new URL(m[1], baseUrl);
    } catch {
      continue;
    }
    if (href.hostname !== base.hostname) continue;
    if (href.href === base.href) continue;
    const path = href.pathname;
    if (/\/(about|about-me|bio|info|profile)\/?$/i.test(path)) {
      if (about.length < 2 && !about.includes(href.href)) about.push(href.href);
    } else if (/\/(portfolio|work|projects?|case-stud(y|ies))\/.+/i.test(path)) {
      // Deep case-study pages, not the section index.
      if (work.length < 4 && !work.includes(href.href)) work.push(href.href);
    }
  }
  return [...about, ...work];
}

export async function aiFillFromSources(sources: {
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  portfolioPassword: string | null;
  resumeText?: string | null;
}): Promise<{ fill?: AiFillResult; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "AI fill isn't configured on this server yet." };
  }

  const [portfolioHtml, linkedinHtml] = await Promise.all([
    sources.portfolioUrl
      ? fetchPortfolioHtml(sources.portfolioUrl, sources.portfolioPassword)
      : Promise.resolve(null),
    sources.linkedinUrl ? fetchPortfolioHtml(sources.linkedinUrl) : Promise.resolve(null),
  ]);

  let portfolioText = portfolioHtml ? visibleText(portfolioHtml) : null;
  const linkedinText = usableLinkedInText(linkedinHtml);
  const resumeText = sources.resumeText?.trim() || null;
  if (!portfolioText && !linkedinText && !resumeText) {
    return {
      error:
        "Couldn't read your portfolio — check the URL (and password, if it's gated), or upload a résumé, and try again.",
    };
  }

  const images =
    portfolioHtml && sources.portfolioUrl ? collectImages(portfolioHtml, sources.portfolioUrl) : [];

  // Headshots and bio copy usually live on an about page; the work itself
  // often lives on case-study subpages — crawl both.
  if (portfolioHtml && sources.portfolioUrl) {
    for (const url of subpageUrls(portfolioHtml, sources.portfolioUrl)) {
      const sub = await fetchPortfolioHtml(url, sources.portfolioPassword);
      if (!sub) continue;
      portfolioText = `${portfolioText}\n\n### Subpage ${url}\n${visibleText(sub).slice(0, 6000)}`;
      const have = new Set(images.map((i) => i.url));
      for (const img of collectImages(sub, url)) {
        if (images.length >= 40) break;
        if (!have.has(img.url)) images.push(img);
      }
    }
  }

  const material = [
    portfolioText ? `## Portfolio site (${sources.portfolioUrl})\n${portfolioText}` : null,
    images.length > 0
      ? `## Images found on the portfolio (pick from these urls only)\n${images
          .map(
            (img, i) =>
              `${i + 1}. ${img.url}${img.alt ? `\n   alt: "${img.alt}"` : ""}${
                img.context ? `\n   nearby text: "${img.context}"` : ""
              }`,
          )
          .join("\n")}`
      : null,
    resumeText ? `## Résumé (uploaded by the candidate)\n${resumeText}` : null,
    linkedinText ? `## LinkedIn (${sources.linkedinUrl})\n${linkedinText}` : null,
    !linkedinText && sources.linkedinUrl
      ? `## LinkedIn\nURL on file (page not publicly readable): ${sources.linkedinUrl}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(AiFill),
    },
    system:
      "You extract structured profile data for a design-talent network from a candidate's own " +
      "website. Fill every field you can support with evidence from the material; use null (or " +
      "an empty array) when the material doesn't say. Never invent employers, titles, dates, " +
      "metrics, people, or accomplishments. Write bio and last_role_text in the candidate's " +
      "first-person voice, staying close to how they describe themselves.\n\n" +
      "Images — prioritize the most recent projects. Determine each pick's company and year " +
      "ONLY from that image's own alt text and 'nearby text' — the urls are opaque, so never " +
      "assign a company by list position or general vibes; if an image's nearby text doesn't " +
      "identify its project, leave company empty and keep the caption purely descriptive. " +
      "Choose images that show actual " +
      "UX/UI work — screens, shipped product, polished visual design — favoring editorial, bold " +
      "imagery where available. Skip process shots (whiteboards, sticky notes, wireframe walls, " +
      "workshop photos) unless process is all the portfolio offers; the goal is final product " +
      "design. NEVER include personal, family, lifestyle, or travel photos as work — images " +
      "whose filename or nearby text suggests kids, family, pets, hobbies, or an about-me " +
      "gallery are off-limits; when in doubt about whether an image shows product work, leave " +
      "it out, and return an empty images array rather than padding it with non-work photos. " +
      "Skip headshots, logos, and decorative graphics in the work images — but do put " +
      "the candidate's own headshot in photo_url when one appears in the image list (its nearby " +
      "text or alt usually names them, or it sits beside their intro).\n\n" +
      "Humblebrags — look for major releases and launches. Lead with those, and state the " +
      "metric or business outcome (growth, revenue, conversion, scale, awards) whenever the " +
      "material provides one. Concrete beats vague.\n\n" +
      "References — only from LinkedIn recommendations or clearly attributed testimonials with " +
      "a real name; leave empty otherwise.\n\n" +
      "For industries, prefer terms from this list when they apply, adding others only when " +
      "clearly warranted: Fintech, Payments, B2B, SaaS, Consumer, E-commerce, Retail, " +
      "Marketplaces, Food & Beverage, Hardware, Wearables, Search, AI, Healthcare, Fitness, " +
      "Enterprise, Productivity, Developer Tools, Social, Media, Gaming, Music, Travel, Mobility.",
    messages: [{ role: "user", content: material }],
  });

  const fill = response.parsed_output;
  if (!fill) return { error: "AI fill came back malformed — please try again." };

  // Guard against invented urls: only keep picks from the harvested list.
  const allowed = new Set(images.map((i) => i.url));
  fill.images = fill.images.filter((img) => allowed.has(img.url));
  if (fill.photo_url && !allowed.has(fill.photo_url)) fill.photo_url = null;

  // No portfolio imagery (common for PMs)? Company logo cards on colored
  // backgrounds keep the "My work" section from being empty.
  if (fill.images.length === 0 && fill.work.length > 0) {
    const companies = uniqueCompanies(fill.work.map((w) => w.company));
    const cards = await makeLogoCards(companies);
    fill.images = cards.map((c) => ({
      url: c.url,
      company: c.company,
      year: null,
      caption: `Product work at ${c.company}`,
    }));
  }

  return { fill };
}
