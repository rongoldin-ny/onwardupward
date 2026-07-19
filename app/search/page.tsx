import { requirePaidRecruiter } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { greeting } from "@/lib/greeting";
import SearchForm from "./SearchForm";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePaidRecruiter();
  const params = await searchParams;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("location_country")
    .eq("role", "candidate")
    .not("location_country", "is", null);
  const countries = [...new Set((data ?? []).map((r) => r.location_country as string))].sort();

  return (
    <SearchForm
      greetingText={greeting()}
      countries={countries}
      initial={{
        role: params.role ?? "",
        stages: params.stages ?? "",
        location: params.location ?? "",
        q: params.q ?? "",
      }}
    />
  );
}
