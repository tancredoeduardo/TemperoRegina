create table if not exists public.site_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'newsletter', 'revendedores', 'analytics')),
  created_at timestamptz not null default now(),
  ip text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.site_submissions enable row level security;

drop policy if exists "Allow public insert" on public.site_submissions;
drop policy if exists "Allow public site submission inserts" on public.site_submissions;
create policy "Allow public insert"
on public.site_submissions
for insert
to public
with check (true);

-- Painel admin estatico: leitura e exclusao via chave publica.
-- Importante: esta permissao de delete e provisoria. Para producao sensivel,
-- troque por Supabase Auth e uma policy restrita a usuarios administradores.
drop policy if exists "Allow public read" on public.site_submissions;
create policy "Allow public read"
on public.site_submissions
for select
to public
using (true);

drop policy if exists "Allow delete" on public.site_submissions;
create policy "Allow delete"
on public.site_submissions
for delete
to public
using (true);

create index if not exists site_submissions_created_at_idx
  on public.site_submissions (created_at desc);

create index if not exists site_submissions_kind_idx
  on public.site_submissions (kind);
