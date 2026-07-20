/**
 * Daily design-mentorship reading for the candidate home. Substack's search
 * API is authwalled, so we aggregate a curated set of design-leadership
 * Substack RSS feeds, rank recent posts by mentorship relevance, and cache
 * for an hour via Next's fetch revalidation.
 */

export type MentorshipPost = {
  title: string;
  url: string;
  publication: string;
  publishedAt: Date;
};

const FEEDS: string[] = [
  "https://davidhoang.substack.com/feed", // Proof of Concept — design leadership
  "https://newsletter.weskao.com/feed", // Wes Kao — career growth, managing up
  "https://www.lennysnewsletter.com/feed", // Lenny — product careers
  "https://designleads.substack.com/feed", // design leadership
];

const RELEVANT =
  /mentor|coach|career|leadership|leading|grow|growth|promotion|feedback|portfolio|manager|hiring|interview|craft|senior|junior|advice/i;

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
  return (m?.[1] ?? "").trim();
}

function parseFeed(xml: string): MentorshipPost[] {
  // The channel title is the publication name — self-labeling survives
  // feed redirects, unlike a hardcoded name.
  const publication = tag(xml.split("<item>")[0], "title") || "Substack";
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items
    .map((item) => ({
      title: tag(item, "title").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'"),
      url: tag(item, "link"),
      publication,
      publishedAt: new Date(tag(item, "pubDate") || 0),
    }))
    .filter((p) => p.title && p.url);
}

export async function getMentorshipPosts(limit = 3): Promise<MentorshipPost[]> {
  const settled = await Promise.allSettled(
    FEEDS.map(async (url) => {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; OU-Reader/1.0)" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [] as MentorshipPost[];
      return parseFeed(await res.text());
    }),
  );

  const all = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const fresh = all
    .filter((p) => Date.now() - p.publishedAt.getTime() < 45 * 24 * 3600 * 1000)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const relevant = fresh.filter((p) => RELEVANT.test(p.title));
  const picks: MentorshipPost[] = [];
  const seenPubs = new Set<string>();
  // Four passes: relevant posts from unseen publications, any relevant,
  // fresh from unseen publications, then anything fresh.
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
  return picks.slice(0, limit);
}
