import type { ReadsPost } from "@/lib/mentorship-posts";

/** Presentational only, so both the server page and the client list can use it. */
export function PostCard({ post }: { post: ReadsPost }) {
  const byline = [post.author ?? post.publication, post.publishedLabel].filter(Boolean).join(" · ");
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[20px] border border-border-1 bg-surface-2 p-5"
    >
      <p className="text-[15px] leading-[1.4] font-bold text-cream">{post.title}</p>
      <p className="mt-1.5 text-[12px] text-secondary">{byline}</p>
      {post.author && (
        <p className="mt-0.5 text-[11px] text-muted">{post.publication} · Substack</p>
      )}
    </a>
  );
}
