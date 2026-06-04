-- MaMa Zainab - Supabase dashboard warning hardening
-- Safe to run multiple times in the Supabase SQL Editor.
--
-- Fixes:
-- - Removes broad SELECT policy on storage.objects for the public uploads bucket.
-- - Revokes RPC execution for public.rls_auto_enable() from client-facing roles.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

-- Public buckets can serve object URLs without allowing clients to list objects.
drop policy if exists "uploads_public_read" on storage.objects;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
