import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMentorshipPosts } from "@/lib/mentorship-posts";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Reads — onward/upward" };

/** Mentorship reading pulled from the house newsletter, curated feeds, and every coach's own Substack. */
export default async function ReadsPage() {
  await requireUser();
  const posts = await getMentorshipPosts(12);

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <header className="flex items-center gap-4">
          <Link href="/dashboard" aria-label="Back" className="text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>

        <main className="mt-9">
          <Eyebrow>Mentorship reads</Eyebrow>
          <h1 className="mt-4 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Today&apos;s reading, curated for you.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-secondary">
            Fresh posts from design and product leadership newsletters — including the
            coaches on our bench.
          </p>

          {posts.length > 0 ? (
            <div className="mt-7 space-y-3">
              {posts.map((post) => (
                <a
                  key={post.url}
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[20px] border border-border-1 bg-surface-2 p-5"
                >
                  <p className="text-[15px] leading-[1.4] font-bold text-cream">{post.title}</p>
                  <p className="mt-1.5 text-[12px] text-secondary">
                    {post.publication} · Substack
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-7 text-[14px] text-secondary">
              Nothing fresh right now — check back soon.
            </p>
          )}
        </main>
      </div>
    </PageFrame>
  );
}
