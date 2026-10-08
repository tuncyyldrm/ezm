create table if not exists public.site_analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in ('page_view', 'page_leave', 'search')),
  path text not null check (char_length(path) <= 512 and left(path, 1) = '/'),
  page_title text not null default '',
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  session_id text not null check (char_length(session_id) between 1 and 64),
  device_type text not null check (device_type in ('mobile', 'tablet', 'desktop')),
  referrer_host text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_analytics_events_created_at_idx
  on public.site_analytics_events (created_at desc);

create index if not exists site_analytics_events_name_created_at_idx
  on public.site_analytics_events (event_name, created_at desc);

alter table public.site_analytics_events enable row level security;
revoke all on public.site_analytics_events from anon, authenticated;
grant all on public.site_analytics_events to service_role;
grant usage, select on sequence public.site_analytics_events_id_seq to service_role;

create or replace function public.get_site_analytics(
  p_start timestamptz,
  p_end timestamptz
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select *
    from public.site_analytics_events
    where created_at >= p_start and created_at < p_end
  ),
  daily as (
    select
      date_trunc('day', created_at)::date as day,
      count(*) filter (where event_name = 'page_view') as views
    from filtered
    group by 1
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'views', count(*) filter (where event_name = 'page_view'),
        'visitors', count(distinct visitor_id) filter (where event_name = 'page_view'),
        'sessions', count(distinct session_id) filter (where event_name = 'page_view')
      )
      from filtered
    ),
    'daily', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', to_char(days.day, 'YYYY-MM-DD'),
          'views', coalesce(daily.views, 0)
        )
        order by days.day
      )
      from generate_series(
        date_trunc('day', p_start),
        date_trunc('day', p_end - interval '1 millisecond'),
        interval '1 day'
      ) as days(day)
      left join daily on daily.day = days.day::date
    ), '[]'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(jsonb_build_object('path', pages.path, 'views', pages.views) order by pages.views desc)
      from (
        select path, count(*) as views
        from filtered
        where event_name = 'page_view'
        group by path
        order by views desc
        limit 10
      ) as pages
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', devices.device_type, 'views', devices.views) order by devices.views desc)
      from (
        select device_type, count(*) as views
        from filtered
        where event_name = 'page_view'
        group by device_type
      ) as devices
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('source', sources.referrer_host, 'views', sources.views) order by sources.views desc)
      from (
        select referrer_host, count(*) as views
        from filtered
        where event_name = 'page_view' and referrer_host <> ''
        group by referrer_host
        order by views desc
        limit 10
      ) as sources
    ), '[]'::jsonb),
    'searches', coalesce((
      select jsonb_agg(jsonb_build_object('term', terms.term, 'count', terms.count) order by terms.count desc)
      from (
        select metadata->>'term' as term, count(*) as count
        from filtered
        where event_name = 'search' and metadata->>'term' <> ''
        group by metadata->>'term'
        order by count desc
        limit 10
      ) as terms
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_site_analytics(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.get_site_analytics(timestamptz, timestamptz) to service_role;
