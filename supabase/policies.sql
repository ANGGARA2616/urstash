-- ============================================================
-- Run ONCE in the Supabase SQL editor, AFTER `npm run db:push`
-- (or db:migrate) has created the tables.
--
-- The app talks to Postgres via the pooler using the `postgres` role,
-- which BYPASSES RLS. Real per-user scoping is enforced in the app layer
-- (lib/auth.ts + withUser). These policies are defense-in-depth: they stop
-- the browser anon/authenticated keys from ever reading these tables.
-- ============================================================

alter table public.items          enable row level security;
alter table public.collections    enable row level security;
alter table public.access_tokens  enable row level security;

-- Authenticated users may only touch their own rows.
create policy "items_own" on public.items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "collections_own" on public.collections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- access_tokens: intentionally NO policy for anon/authenticated.
-- RLS enabled + no permissive policy = deny-all for non-service roles.
-- The app reads/writes this table only via the service (Drizzle) path.

-- ============================================================
-- Storage: private 'media' bucket, one folder per user.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('media', 'media', false)
  on conflict (id) do nothing;

create policy "media_own_read" on storage.objects
  for select
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_own_write" on storage.objects
  for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_own_delete" on storage.objects
  for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
