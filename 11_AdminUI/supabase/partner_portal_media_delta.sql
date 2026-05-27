-- Partner Portal media + map-pin schema delta
-- Safe to run multiple times in Supabase SQL Editor.

alter table branches add column if not exists lat numeric;
alter table branches add column if not exists lng numeric;
alter table branches add column if not exists partner_type text not null default '';
alter table branches add column if not exists priority text not null default 'prospect';
alter table branches add column if not exists footfall_estimate text not null default '';
alter table branches add column if not exists recommended_format text not null default '';
alter table branches add column if not exists commercial_model text not null default '';
alter table branches add column if not exists show_in_partner_portal boolean not null default true;

alter table partner_settings add column if not exists presentation_title text not null default 'MaMa Zainab Partner Presentation';
alter table partner_settings add column if not exists presentation_subtitle text not null default 'Authentic Mahshi. Homemade Taste. Fast-Food Speed.';
alter table partner_settings add column if not exists presentation_file_url text not null default '/Mama-Zainab-Partners-Presentation.pdf';
alter table partner_settings add column if not exists presentation_version text not null default 'v0.1';
alter table partner_settings add column if not exists presentation_updated_at text not null default '';
alter table partner_settings add column if not exists contact_email text not null default 'hello@mamazainab.com';
alter table partner_settings add column if not exists contact_phone text not null default '';
alter table partner_settings add column if not exists booking_url text not null default '';
alter table partner_settings add column if not exists assessment_url text not null default '';

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
