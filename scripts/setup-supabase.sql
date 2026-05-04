create table if not exists public.site_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'newsletter', 'revendedores', 'analytics')),
  created_at timestamptz not null default now(),
  ip text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.site_submissions enable row level security;

drop policy if exists "Allow public site submission inserts" on public.site_submissions;
create policy "Allow public site submission inserts"
on public.site_submissions
for insert
to anon, authenticated
with check (
  kind in ('contact', 'newsletter', 'revendedores', 'analytics')
  and jsonb_typeof(payload) = 'object'
);

create index if not exists site_submissions_created_at_idx
  on public.site_submissions (created_at desc);

create index if not exists site_submissions_kind_idx
  on public.site_submissions (kind);
