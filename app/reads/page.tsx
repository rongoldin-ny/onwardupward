import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getReadsPageData } from "@/lib/mentorship-posts";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";
import CoachReads from "./CoachReads";
import { PostCard } from "./PostCard";

export const metadata = { title: "Reads — onward/upward" };

/** Mentorship reading pulled from the house newsletter, curated feeds, and every coach's own Substack. */
export default async function ReadsPage() {
  await requireUser();
  const { coachPosts, otherPosts } = await getReadsPageData();

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
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
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.5] text-secondary">
            Fresh posts from design and product leadership newsletters — including the
            coaches on our bench.
          </p>

          {coachPosts.length > 0 && (
            <section className="mt-9">
              <Eyebrow>From our coaches</Eyebrow>
              <CoachReads posts={coachPosts} />
            </section>
          )}

          <section className="mt-9">
            <Eyebrow>More reading</Eyebrow>
            {otherPosts.length > 0 ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {otherPosts.map((post) => (
                  <PostCard key={post.url} post={post} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-secondary">
                Nothing fresh right now — check back soon.
              </p>
            )}
          </section>

          {coachPosts.length === 0 && otherPosts.length === 0 && (
            <p className="mt-7 text-[14px] text-secondary">
              Nothing fresh right now — check back soon.
            </p>
          )}
        </main>
      </div>
    </PageFrame>
  );
}
