/**
 * Design-mentorship reading for the candidate home and the /reads page.
 * Substack's search API is authwalled, so we aggregate a curated set of
 * design-leadership Substack RSS feeds — plus every coach's own newsletter
 * from the `coaches` table, tagged so coach writing can be told apart
 * downstream — rank recent posts by mentorship relevance, and cache for an
 * hour via Next's fetch revalidation.
 */

import { getCoachFeeds } from "./coaches-db";
import { decodeHtmlEntities } from "./html-entities";
import { coachDisciplineLabels } from "./coach-shared";

export type MentorshipPost = {
  title: string;
  url: string;
  publication: string;
  publishedAt: Date;
  house?: boolean;
  isCoach?: boolean;
  /** The coach who writes this feed, when the post came from one. */
  author?: string;
  /** Discipline facets inherited from that coach, for the digest in lib/notifications.ts. */
  disciplines?: string[];
};

/** Serializable shape handed to the client: Dates become a prerendered label. */
export type ReadsPost = {
  title: string;
  url: string;
  publication: string;
  publishedLabel: string;
  /** Epoch ms, for callers that need to filter by recency. 0 when unparseable. */
  publishedAtMs: number;
  /** Written by a coach with a listing on the platform. */
  isCoach: boolean;
  author?: string;
  disciplines: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Fixed UTC formatting — toLocaleDateString would drift between server and browser. */
function publishedLabel(d: Date): string {
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function toReadsPost(p: MentorshipPost): ReadsPost {
  const ms = p.publishedAt.getTime();
  return {
    title: p.title,
    url: p.url,
    publication: p.publication,
    publishedLabel: publishedLabel(p.publishedAt),
    publishedAtMs: Number.isNaN(ms) ? 0 : ms,
    isCoach: !!p.isCoach,
    author: p.author,
    disciplines: p.disciplines ?? [],
  };
}

/** The house newsletter — its freshest post gets a pinned slot. */
const HOUSE_FEED = "https://rongoldin.substack.com/feed";

/** Curated, non-coach feeds. Coach newsletters come from `coaches.substack_url`. */
const CURATED_FEEDS: string[] = [
  HOUSE_FEED, // Formative — product, design & AI
  "https://davidhoang.substack.com/feed", // Proof of Concept — design leadership
  "https://newsletter.weskao.com/feed", // Wes Kao — career growth, managing up
  "https://www.lennysnewsletter.com/feed", // Lenny — product careers
  "https://designleads.substack.com/feed", // design leadership
];

function toFeedUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/feed") ? trimmed : `${trimmed}/feed`;
}

const RELEVANT =
  /mentor|coach|career|leadership|leading|grow|growth|promotion|feedback|portfolio|manager|hiring|interview|craft|senior|junior|advice/i;

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
  return (m?.[1] ?? "").trim();
}

function parseFeed(xml: string): Omit<MentorshipPost, "house" | "isCoach">[] {
  // The channel title is the publication name — self-labeling survives
  // feed redirects, unlike a hardcoded name.
  const publication = decodeHtmlEntities(tag(xml.split("<item>")[0], "title")) || "Substack";
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items
    .map((item) => ({
      title: decodeHtmlEntities(tag(item, "title")),
      url: tag(item, "link"),
      publication,
      publishedAt: new Date(tag(item, "pubDate") || 0),
    }))
    .filter((p) => p.title && p.url);
}

/** Fetches every feed, tags each post by source, and returns the fresh ones (newest first). */
async function fetchFreshPosts(): Promise<MentorshipPost[]> {
  const coaches = await getCoachFeeds().catch(() => []);
  // Feed URL → coach, so each post can carry its author and facets. Two coaches
  // sharing a newsletter would collide; last one wins, which is fine.
  const byFeedUrl = new Map(coaches.map((c) => [toFeedUrl(c.substack_url), c]));
  const feeds = Array.from(new Set([...CURATED_FEEDS, ...byFeedUrl.keys()]));

  const settled = await Promise.allSettled(
    feeds.map(async (url) => {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; OU-Reader/1.0)" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [] as MentorshipPost[];
      const coach = byFeedUrl.get(url);
      return parseFeed(await res.text()).map((p) => ({
        ...p,
        house: url === HOUSE_FEED,
        isCoach: !!coach,
        author: coach?.full_name,
        disciplines: coach ? coachDisciplineLabels(coach) : undefined,
      }));
    }),
  );

  const all = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return all
    .filter((p) => Date.now() - p.publishedAt.getTime() < 45 * 24 * 3600 * 1000)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/** Four passes: relevant posts from unseen publications, any relevant, fresh from unseen publications, then anything fresh. */
function pickPosts(fresh: MentorshipPost[], limit: number): MentorshipPost[] {
  const relevant = fresh.filter((p) => RELEVANT.test(p.title));
  const picks: MentorshipPost[] = [];
  const seenPubs = new Set<string>();
  const passes: [MentorshipPost[], boolean][] = [
    [relevant, true],
    [relevant, false],
    [fresh, true],
    [fresh, false],
  ];
  for (const [pool, spreadPubs] of passes) {
    for (const p of pool) {
      if (picks.length >= limit) break;
      if (picks.some((x) => x.url === p.url)) continue;
      if (spreadPubs && seenPubs.has(p.publication)) continue;
      picks.push(p);
      seenPubs.add(p.publication);
    }
  }
  return picks;
}

/** Dashboard preview: a short, blended list with the house feed pinned in. */
export async function getMentorshipPosts(limit = 3): Promise<MentorshipPost[]> {
  const fresh = await fetchFreshPosts();
  const picks = pickPosts(fresh, limit);
  // Pin the freshest house post into the lineup if relevance didn't pick it.
  const house = fresh.find((p) => p.house);
  if (house && !picks.some((p) => p.url === house.url)) picks.unshift(house);
  return picks.slice(0, limit);
}

/**
 * The /reads page: coach writing gets its own section instead of being crowded
 * out by the bigger curated newsletters. Coach posts are uncapped — the page
 * paginates them — and ordered by relevance, so the most mentorship-shaped
 * writing surfaces first while everything fresh stays reachable.
 */
export async function getReadsPageData(
  otherLimit = 8,
): Promise<{ coachPosts: ReadsPost[]; otherPosts: ReadsPost[] }> {
  const fresh = await fetchFreshPosts();
  const coachPosts = pickPosts(
    fresh.filter((p) => p.isCoach),
    Infinity,
  );
  const otherFresh = fresh.filter((p) => !p.isCoach);
  const otherPosts = pickPosts(otherFresh, otherLimit);
  const house = otherFresh.find((p) => p.house);
  if (house && !otherPosts.some((p) => p.url === house.url)) otherPosts.unshift(house);
  return {
    coachPosts: coachPosts.map(toReadsPost),
    otherPosts: otherPosts.slice(0, otherLimit).map(toReadsPost),
  };
}
