/**
 * The old SQLite demo seed is retired — data now lives in Supabase.
 * Demo data was ported once by scripts/migrate-sqlite.ts.
 *
 * To reset a demo account, delete the user in the Supabase dashboard
 * (Authentication → Users) and re-run scripts/migrate-sqlite.ts, which
 * skips existing emails and recreates missing ones from .data/ou.db.
 */
console.log(
  "This project now uses Supabase. See scripts/migrate-sqlite.ts (one-time port) " +
    "and scripts/supabase-setup.ts (bucket provisioning).",
);
