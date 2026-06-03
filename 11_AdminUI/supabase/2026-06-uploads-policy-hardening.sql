-- MaMa Zainab - uploads bucket policy hardening
-- Run this instead of the full migration when only fixing live menu/photo uploads.
--
-- Scope:
-- - Keeps the public 'uploads' bucket public-readable.
-- - Replaces only the upload write/update/delete policies.
-- - Does not drop tables, delete rows, or modify menu data.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

do $$ begin
  create policy "uploads_public_read"
    on storage.objects
    for select
    using (bucket_id = 'uploads');
exception when duplicate_object then null; end $$;

drop policy if exists "uploads_service_write" on storage.objects;
drop policy if exists "uploads_service_update" on storage.objects;
drop policy if exists "uploads_service_delete" on storage.objects;

create policy "uploads_service_write"
  on storage.objects
  for insert
  with check (bucket_id = 'uploads' and auth.role() = 'service_role');

create policy "uploads_service_update"
  on storage.objects
  for update
  using (bucket_id = 'uploads' and auth.role() = 'service_role')
  with check (bucket_id = 'uploads' and auth.role() = 'service_role');

create policy "uploads_service_delete"
  on storage.objects
  for delete
  using (bucket_id = 'uploads' and auth.role() = 'service_role');
