-- Weekly digest bookkeeping: when we last emailed each member their digest.
-- Lets the cron be safely re-run (or fire twice) without double-sending.
alter table profiles
  add column if not exists last_digest_sent_at timestamptz;
