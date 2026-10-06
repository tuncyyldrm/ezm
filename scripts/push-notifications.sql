create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.push_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_url text not null,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.push_campaigns enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_campaigns from anon, authenticated;

grant all on public.push_subscriptions to service_role;
grant all on public.push_campaigns to service_role;
