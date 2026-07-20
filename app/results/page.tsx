import Link from "next/link";
import { ArrowLeft, SearchX, Star } from "lucide-react";
import { requirePaidRecruiter } from "@/lib/auth";
import { trackEvent } from "@/lib/db";
import { searchCandidates } from "@/lib/search";
import { labelForCareerStage, labelForRoleType } from "@/lib/taxonomy";
import { Avatar, Eyebrow, Logo, PageFrame, SupporterBadge, Tag } from "@/components/ui";

export default async function Results({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePaidRecruiter();
  const params = await searchParams;
  const filters = {
    role: params.role ?? "",
    stages: (params.stages ?? "").split(",").filter(Boolean),
    location: params.location ?? "",
    q: (params.q ?? "").trim(),
  };
  const results = await searchCandidates(filters);

  await trackEvent(user.id, "search_query", null, {
    query_text: filters.q,
    role_filter: filters.role,
    career_stage_filter: filters.stages,
    location_filter: filters.location,
    result_count: results.length,
  });

  const backParams = new URLSearchParams();
  if (params.role) backParams.set("role", params.role);
  if (params.stages) backParams.set("stages", params.stages);
  if (params.location) backParams.set("location", params.location);
  if (params.q) backParams.set("q", params.q);
  const editHref = `/search?${backParams.toString()}`;

  const summary =
    filters.q ||
    [
      filters.role ? labelForRoleType(filters.role) : "",
      filters.stages.map(labelForCareerStage).join(" · "),
      filters.location,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Everyone";

  return (
    <PageFrame size="wide">
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-4 border-b border-border-1 px-6 py-5 lg:px-10">
        <span className="shrink-0 md:hidden [&_a]:text-[17px]">
          <Logo />
        </span>
        <Link href={editHref} aria-label="Back" className="text-cream">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <p className="min-w-0 flex-1 truncate text-[15px] text-body">
          &quot;{summary}&quot;
        </p>
        <Link href={editHref} className="text-[15px] font-bold">
          Edit
        </Link>
      </header>

      <main className="flex-1 px-6 pt-7 pb-8 lg:px-10 lg:pb-10">
        {results.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border-2">
              <SearchX size={22} strokeWidth={1.5} className="text-secondary" />
            </span>
            <p className="mt-6 text-[16px] text-body">
              No matches yet — try broadening your search.
            </p>
            <Link href={editHref} className="mt-4 text-[15px] font-bold">
              Refine the search
            </Link>
          </div>
        ) : (
          <>
            <Eyebrow>
              {results.length} {results.length === 1 ? "match" : "matches"}
            </Eyebrow>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {results.map((c, index) => (
                <Link
                  key={c.id}
                  href={`/candidate/${c.id}`}
                  className={`block rounded-[20px] border bg-surface-2 p-5 ${
                    index === 0 && filters.q ? "border-gold-border" : "border-border-1"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar id={c.id} src={c.photoUrl} size={52} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="flex min-w-0 items-center gap-2 truncate text-[19px] font-black tracking-[-0.02em] text-cream">
                          <span className="truncate">{c.name}</span>
                          {c.isSupporter && <SupporterBadge size="sm" />}
                        </h2>
                        {index === 0 && filters.q && (
                          <span className="eyebrow flex shrink-0 items-center gap-1.5 text-gold">
                            <Star size={11} fill="currentColor" strokeWidth={0} />
                            Top match
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[14px] text-secondary">
                        {c.roleLabel} · {c.city}
                      </p>
                    </div>
                  </div>
                  {c.bio && (
                    <p className="mt-4 line-clamp-3 text-[14px] leading-[1.5] text-body-2">
                      {c.bio}
                    </p>
                  )}
                  {c.companies.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.companies.map((company) => (
                        <Tag key={company}>{company}</Tag>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
    </PageFrame>
  );
}
