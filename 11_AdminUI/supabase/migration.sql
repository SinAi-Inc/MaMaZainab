-- MaMa Zainab - Supabase schema migration
-- Run this in the Supabase SQL Editor to set up all tables.

-- ============================================================
-- 1. Contacts
-- ============================================================
create table if not exists contacts (
  id          text primary key,
  email       text not null unique,
  subscribed_at text not null,       -- ISO 8601
  source      text not null default 'coming-soon'
);

-- ============================================================
-- 2. Menu categories
-- ============================================================
create table if not exists menu_categories (
  id             text primary key,
  name_en        text not null,
  description_en text not null default '',
  sort           integer not null default 0,
  visible        boolean not null default true,
  created_at     text not null,
  updated_at     text not null
);

-- ============================================================
-- 3. Menu items
-- ============================================================
create table if not exists menu_items (
  id             text primary key,
  category_id    text not null references menu_categories(id) on delete cascade,
  sku            text not null default '',
  name_en        text not null,
  name_ar        text not null default '',
  description_en text not null default '',
  description_ar text not null default '',
  price_egp      numeric not null default 0,
  calories_label text not null default '',
  serving_info   text not null default '',
  highlights     jsonb not null default '[]',
  image_url      text not null default '',
  badges         jsonb not null default '[]',
  available      boolean not null default true,
  sort           integer not null default 0,
  created_at     text not null,
  updated_at     text not null
);

alter table menu_items add column if not exists name_ar text not null default '';
alter table menu_items add column if not exists description_ar text not null default '';
alter table menu_items add column if not exists calories_label text not null default '';
alter table menu_items add column if not exists serving_info text not null default '';
alter table menu_items add column if not exists highlights jsonb not null default '[]';

-- ============================================================
-- 4. Settings (singleton)
-- ============================================================
create table if not exists settings (
  id               integer primary key default 1 check (id = 1),
  user_name        text not null default 'HITL Admin',
  email            text not null default 'admin@mamazainab.com',
  primary_language text not null default 'English',
  secondary_language text not null default 'Arabic (Egyptian)',
  currency         text not null default 'EGP',
  timezone         text not null default 'Africa/Cairo',
  notify_menu_changes  boolean not null default true,
  notify_video_updates boolean not null default true,
  notify_maintenance   boolean not null default true,
  ordering_api_url     text not null default '',
  ordering_api_enabled boolean not null default false,
  pos_api_url          text not null default '',
  pos_api_enabled      boolean not null default false,
  delivery_api_url     text not null default '',
  delivery_api_enabled boolean not null default false,
  social_facebook  text not null default '',
  social_instagram text not null default '',
  social_tiktok    text not null default '',
  social_twitter   text not null default '',
  social_youtube   text not null default '',
  social_whatsapp  text not null default '',
  nvidia_api_key   text not null default '',
  session_timeout  text not null default '30',
  require_password boolean not null default false,
  admin_password   text not null default '',
  allow_public_menu boolean not null default true,
  session_floor    text not null default ''
);

-- Insert default row
insert into settings (id) values (1) on conflict do nothing;

-- ============================================================
-- 5. Characters
-- ============================================================
create table if not exists characters (
  id               text primary key,
  name             text not null,
  subtitle         text not null default '',
  role             text not null default '',
  visibility       text not null default 'high',
  anchor_block     text not null default '',
  reference_images jsonb not null default '[]',
  identity_fields  jsonb not null default '[]',
  modes            jsonb not null default '[]',
  voice_provider   text not null default '',
  voice_id         text not null default '',
  voice_notes      text not null default '',
  dos              jsonb not null default '[]',
  donts            jsonb not null default '[]',
  surface_usage    text not null default '',
  active           boolean not null default true,
  sort             integer not null default 0,
  created_at       text not null,
  updated_at       text not null
);

-- ============================================================
-- 6. Branches
-- ============================================================
create table if not exists branches (
  id           text primary key,
  kiosk_number integer not null,
  name         text not null,
  city         text not null default 'Alexandria',
  district     text not null default '',
  address      text not null default '',
  phone        text not null default '',
  manager      text not null default '',
  status       text not null default 'construction',
  open_hours   text not null default '09:00–23:00',
  seating      integer not null default 0,
  notes        text not null default ''
);

alter table branches add column if not exists lat numeric;
alter table branches add column if not exists lng numeric;
alter table branches add column if not exists partner_type text not null default '';
alter table branches add column if not exists priority text not null default 'prospect';
alter table branches add column if not exists footfall_estimate text not null default '';
alter table branches add column if not exists recommended_format text not null default '';
alter table branches add column if not exists commercial_model text not null default '';
alter table branches add column if not exists show_in_partner_portal boolean not null default true;

-- ============================================================
-- 7. Video Studio - Projects
-- ============================================================
create table if not exists projects (
  id                  text primary key,
  title               text not null,
  logline             text not null default '',
  synopsis            text not null default '',
  status              text not null default 'concept',
  script              text not null default '',
  script_source_path  text not null default '',
  target_duration_sec integer not null default 0,
  aspect_ratio        text not null default '2.39:1',
  default_model       text not null default 'runway/gen4',
  style_suffix        text not null default '',
  poster_url          text not null default '',
  master_cut_url      text not null default '',
  tags                jsonb not null default '[]',
  created_at          text not null,
  updated_at          text not null
);

-- ============================================================
-- 8. Generations - Studio generation history
-- ============================================================
create table if not exists generations (
  id                text primary key,
  type              text not null,            -- 'image' | 'video'
  model             text not null,
  prompt            text not null,
  character_anchor  text not null default '',
  scene_context     text not null default '',
  aspect            text not null default '1:1',
  duration          integer,
  style_preset      text not null default '',
  output_path       text not null default '',
  status            text not null default 'completed',
  error             text not null default '',
  elapsed_ms        integer not null default 0,
  cost_usd          numeric(10, 4) not null default 0,
  created_at        text not null
);

-- Idempotent migration for existing deployments
alter table generations add column if not exists cost_usd numeric(10, 4) not null default 0;

-- ============================================================
-- 8. Video Studio - Scenes
-- ============================================================
create table if not exists scenes (
  id              text primary key,
  project_id      text not null references projects(id) on delete cascade,
  number          integer not null,
  heading         text not null default '',
  summary         text not null default '',
  script_excerpt  text not null default '',
  sort            integer not null default 0,
  created_at      text not null,
  updated_at      text not null
);

-- ============================================================
-- 9. Video Studio - Shots
-- ============================================================
create table if not exists shots (
  id               text primary key,
  project_id       text not null references projects(id) on delete cascade,
  scene_id         text not null references scenes(id) on delete cascade,
  number           text not null default '',
  type             text not null default 'medium',
  duration_sec     integer not null default 4,
  description      text not null default '',
  dialogue         text not null default '',
  camera_notes     text not null default '',
  prompt           text not null default '',
  reference_urls   jsonb not null default '[]',
  status           text not null default 'pending',
  approved_take_id text not null default '',
  sort             integer not null default 0,
  keyframe_url          text not null default '',
  keyframe_approved_at  text not null default '',
  keyframe_seed         integer not null default 0,
  audio                 jsonb not null default '{"voLine":"","voice":"","sfxCue":"","voUrl":"","sfxUrl":""}'::jsonb,
  created_at       text not null,
  updated_at       text not null
);

-- Idempotent column adds for existing deployments
alter table shots add column if not exists keyframe_url         text not null default '';
alter table shots add column if not exists keyframe_approved_at text not null default '';
alter table shots add column if not exists keyframe_seed        integer not null default 0;
alter table shots add column if not exists audio                jsonb not null default '{"voLine":"","voice":"","sfxCue":"","voUrl":"","sfxUrl":""}'::jsonb;

-- ============================================================
-- 10. Video Studio - Takes
-- ============================================================
create table if not exists takes (
  id            text primary key,
  project_id    text not null references projects(id) on delete cascade,
  shot_id       text not null references shots(id) on delete cascade,
  index         integer not null,
  model         text not null default 'runway/gen4',
  prompt        text not null default '',
  external_id   text not null default '',
  seed          text not null default '',
  status        text not null default 'queued',
  video_url     text not null default '',
  thumbnail_url text not null default '',
  duration_sec  integer not null default 0,
  notes         text not null default '',
  created_at    text not null,
  updated_at    text not null
);

-- ============================================================
-- 11. Partner Settings (singleton)
-- ============================================================
create table if not exists partner_settings (
  id                     text primary key default 'singleton' check (id = 'singleton'),
  passcode               text not null default '',
  portal_enabled         boolean not null default false,
  show_presentation      boolean not null default true,
  show_locations         boolean not null default true,
  show_brand_overview    boolean not null default true,
  show_menu              boolean not null default false,
  featured_location_ids  jsonb not null default '[]'
);

alter table partner_settings add column if not exists presentation_title text not null default 'MaMa Zainab Partner Presentation';
alter table partner_settings add column if not exists presentation_subtitle text not null default 'Authentic Mahshi. Homemade Taste. Fast-Food Speed.';
alter table partner_settings add column if not exists presentation_file_url text not null default '/Mama-Zainab-Partners-Presentation.pdf';
alter table partner_settings add column if not exists presentation_version text not null default 'v0.1';
alter table partner_settings add column if not exists presentation_updated_at text not null default '';
alter table partner_settings add column if not exists contact_email text not null default 'hello@mamazainab.com';
alter table partner_settings add column if not exists contact_phone text not null default '';
alter table partner_settings add column if not exists booking_url text not null default '';
alter table partner_settings add column if not exists assessment_url text not null default '';

-- Insert default row
insert into partner_settings (id) values ('singleton') on conflict do nothing;

-- ============================================================
-- 12. Brand Media Assets
-- ============================================================
create table if not exists brand_media_assets (
  id              text primary key,
  title           text not null,
  description     text not null default '',
  url             text not null,
  thumbnail_url   text not null default '',
  alt             text not null,
  category        text not null default 'other',
  usage           text not null default 'general',
  partner_type    text not null default '',
  slide_id        text not null default '',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      text not null default '',
  updated_at      text not null default ''
);

-- ============================================================
-- 13. Storage bucket for uploads
-- ============================================================
-- Creates the public 'uploads' bucket if it does not already exist.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Public buckets serve object URLs without a broad storage.objects SELECT policy.
-- Keep the bucket public, but prevent anon clients from listing all uploaded files.
drop policy if exists "uploads_public_read" on storage.objects;

-- Server actions write with the server Supabase key. Keep upload writes restricted.
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

-- ============================================================
-- Incremental migrations (safe to re-run)
-- ============================================================

-- Add session_floor column to settings (session invalidation)
alter table settings add column if not exists session_floor text not null default '';

-- ============================================================
-- 13. Video Jobs - provider-agnostic video generation queue
-- ============================================================
create table if not exists video_jobs (
  id                   text primary key,
  provider_id          text not null,
  provider_job_id      text not null default '',
  tier                 text not null default 'hero',
  project_id           text not null default '',
  shot_id              text not null default '',
  take_id              text not null default '',
  prompt               text not null,
  negative_prompt      text not null default '',
  character_anchors    jsonb not null default '[]',
  reference_image_urls jsonb not null default '[]',
  image_url            text not null default '',
  aspect_ratio         text not null default '16:9',
  duration_sec         integer not null default 5,
  seed                 integer not null default 0,
  status               text not null default 'queued',
  output_url           text not null default '',
  poster_url           text not null default '',
  estimated_cost_usd   numeric(10,4) not null default 0,
  actual_cost_usd      numeric(10,4) not null default 0,
  error                text not null default '',
  provider_meta        jsonb not null default '{}',
  created_at           text not null,
  updated_at           text not null
);
create index if not exists video_jobs_project_idx on video_jobs(project_id);
create index if not exists video_jobs_status_idx on video_jobs(status);

-- Project budget tracking
alter table projects add column if not exists budget_usd numeric(10,2) not null default 0;
alter table projects add column if not exists spent_usd numeric(10,2) not null default 0;

-- ============================================================
-- Supabase warning hardening
-- ============================================================

-- If present, this SECURITY DEFINER helper should not be callable through
-- /rest/v1/rpc by anon or authenticated clients.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

