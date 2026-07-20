// Reset a user's "Fill with AI" usage: npx tsx --env-file=.env.local scripts/reset-ai-fill.ts someone@example.com
import { supabaseAdmin } from "../lib/supabase/server";
const email = process.argv[2];
if (!email) { console.error("usage: reset-ai-fill.ts <email>"); process.exit(1); }
const sb = supabaseAdmin();
(async () => {
  const { data: user } = await sb.from("profiles").select("id").eq("email", email).single();
  if (!user) { console.error("no profile for", email); process.exit(1); }
  const { data } = await sb.from("analytics_events").delete().eq("user_id", user.id)
    .eq("event_type", "element_click").contains("metadata", { element: "ai_fill" }).select("id");
  console.log("cleared", data?.length ?? 0, "ai-fill uses for", email);
})();
