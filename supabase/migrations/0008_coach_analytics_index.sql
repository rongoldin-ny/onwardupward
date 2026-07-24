-- Coach analytics rolls up analytics_events by metadata->>'coach_id' now that
-- every coach_view event (impression/detail/book) carries it. Index keeps
-- that per-coach lookup cheap as directory impressions add write volume.
create index if not exists analytics_coach_id_idx
  on public.analytics_events ((metadata->>'coach_id'))
  where event_type = 'coach_view';
