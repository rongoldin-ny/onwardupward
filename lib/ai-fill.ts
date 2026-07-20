import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fetchPortfolioHtml, visibleText } from "./extract";
import { CAREER_STAGES, COUNTRIES, ROLE_TYPES } from "./taxonomy";

/**
 * "Fill with AI" — Claude reads the candidate's portfolio (and LinkedIn when
 * it's publicly reachable) and proposes values for every profile field.
 * Nothing is written to the database here; the settings form shows the
 * proposal for review and the normal Save persists it.
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
  dream_job: z
    .string()
    .nullable()
    .describe("Their ideal next role, ONLY if the site states what they're looking for"),
  brags: z
    .array(z.string())
    .max(5)
    .describe("Up to five concrete career highlights found in the material"),
  work: z
    .array(z.object({ title: z.string(), company: z.string() }))
    .max(3)
    .describe("Their last three jobs, most recent first"),
});

export type AiFillResult = z.infer<typeof AiFill>;

/** LinkedIn usually authwalls bots — only pass along pages with real content. */
function usableLinkedInText(html: string | null): string | null {
  if (!html) return null;
  if (/authwall|join linkedin|sign in to view/i.test(html.slice(0, 5000))) return null;
  const text = visibleText(html);
  return text.length > 1500 ? text : null;
}

export async function aiFillFromSources(sources: {
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  portfolioPassword: string | null;
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

  const portfolioText = portfolioHtml ? visibleText(portfolioHtml) : null;
  const linkedinText = usableLinkedInText(linkedinHtml);
  if (!portfolioText && !linkedinText) {
    return {
      error:
        "Couldn't read your portfolio — check the URL (and password, if it's gated) and try again.",
    };
  }

  const material = [
    portfolioText ? `## Portfolio site (${sources.portfolioUrl})\n${portfolioText}` : null,
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
      "an empty array) when the material doesn't say. Never invent employers, titles, dates, or " +
      "accomplishments. Write bio, last_role_text, and dream_job in the candidate's first-person " +
      "voice, staying close to how they describe themselves. For industries, prefer terms from " +
      "this list when they apply, adding others only when clearly warranted: Fintech, Payments, " +
      "B2B, SaaS, Consumer, E-commerce, Retail, Marketplaces, Food & Beverage, Hardware, " +
      "Wearables, Search, AI, Healthcare, Fitness, Enterprise, Productivity, Developer Tools, " +
      "Social, Media, Gaming, Music, Travel, Mobility.",
    messages: [{ role: "user", content: material }],
  });

  const fill = response.parsed_output;
  if (!fill) return { error: "AI fill came back malformed — please try again." };
  return { fill };
}
