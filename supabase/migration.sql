-- MaMa Zainab — Supabase schema migration
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
  description_en text not null default '',
  price_egp      numeric not null default 0,
  image_url      text not null default '',
  badges         jsonb not null default '[]',
  available      boolean not null default true,
  sort           integer not null default 0,
  created_at     text not null,
  updated_at     text not null
);

-- ============================================================
-- 4. Settings (singleton)
-- ============================================================
create table if not exists settings (
  id               integer primary key default 1 check (id = 1),
  user_name        text not null default 'HITL Admin',
  email            text not null default 'hello@mamazainab.com',
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
  allow_public_menu boolean not null default true
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

-- ============================================================
-- 7. Video Studio — Projects
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
  default_model       text not null default 'stabilityai/stable-video-diffusion',
  style_suffix        text not null default '',
  poster_url          text not null default '',
  master_cut_url      text not null default '',
  tags                jsonb not null default '[]',
  created_at          text not null,
  updated_at          text not null
);

-- ============================================================
-- 8. Video Studio — Scenes
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
-- 9. Video Studio — Shots
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
  created_at       text not null,
  updated_at       text not null
);

-- ============================================================
-- 10. Video Studio — Takes
-- ============================================================
create table if not exists takes (
  id            text primary key,
  project_id    text not null references projects(id) on delete cascade,
  shot_id       text not null references shots(id) on delete cascade,
  index         integer not null,
  model         text not null default 'stabilityai/stable-video-diffusion',
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
-- 11. Storage bucket for uploads
-- ============================================================
-- Run this separately or via the Supabase dashboard:
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);
