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
alter table partner_settings add column if not exists presentation_file_url text not null default '/partner-portal/deck';
alter table partner_settings add column if not exists presentation_version text not null default 'v0.1';
alter table partner_settings add column if not exists presentation_updated_at text not null default '';
alter table partner_settings add column if not exists brand_video_url text not null default '';
alter table partner_settings add column if not exists brand_video_title text not null default 'Brand Video';
alter table partner_settings add column if not exists brand_video_body text not null default 'Watch the MaMa Zainab brand story and partnership experience before reviewing the deck.';
alter table partner_settings add column if not exists brand_overview_title text not null default 'Fast-food Mahshi & oriental home-food';
alter table partner_settings add column if not exists brand_overview_body text not null default 'MaMa Zainab is village authenticity at scale: warm, nostalgic, premium-casual Egyptian comfort food founded in Alexandria.';
alter table partner_settings add column if not exists portal_benefits_title text not null default 'Why the kiosk earns its space';
alter table partner_settings add column if not exists portal_benefits_eyebrow text not null default 'Property Partner Benefits';
alter table partner_settings add column if not exists portal_commercial_title text not null default 'Flexible model paths';
alter table partner_settings add column if not exists portal_commercial_eyebrow text not null default 'Commercial Models';
alter table partner_settings add column if not exists portal_locations_title text not null default 'Partner-ready rollout points';
alter table partner_settings add column if not exists portal_locations_eyebrow text not null default 'Featured Locations';
alter table partner_settings add column if not exists brand_host_eyebrow text not null default 'Brand Host';
alter table partner_settings add column if not exists brand_host_title text not null default 'The familiar face of village comfort food';
alter table partner_settings add column if not exists brand_host_body text not null default 'MaMa Zainab brings warmth, trust, and instant recognition to every partner location, turning a compact kiosk into a memorable local food destination.';
alter table partner_settings add column if not exists brand_host_usage_label text not null default 'Usage';
alter table partner_settings add column if not exists brand_host_usage_value text not null default 'Partner introductions';
alter table partner_settings add column if not exists brand_host_context_label text not null default 'Context';
alter table partner_settings add column if not exists brand_host_context_value text not null default 'Brand origin and trust';
alter table partner_settings add column if not exists brand_owner_eyebrow text not null default 'Brand Owner';
alter table partner_settings add column if not exists brand_owner_body text not null default 'Sheng Heng Wang is the founder and brand owner behind the MaMa Zainab rollout, with the founder seal reserved for authorized partner material.';
alter table partner_settings add column if not exists portal_slides jsonb not null default '[
  {"id":"cover","eyebrow":"Partner Opportunity","title":"Bring MaMa Zainab to Your Location","body":"A compact, high-visibility Egyptian comfort-food kiosk built for premium footfall destinations.","visual":"Kiosk hero + Alexandria rollout map"},
  {"id":"brand","eyebrow":"Brand Promise","title":"The Village Way, or Not at All","body":"Authentic Mahshi and oriental home-food, served with homemade warmth and fast-food speed.","visual":"Logo, palette, MaMa Zainab character, pattern system"},
  {"id":"format","eyebrow":"Kiosk Format","title":"Small Footprint. Big Brand Presence.","body":"A modular kiosk format designed for food courts, entrances, club zones, cinema lobbies, and retail corridors.","visual":"3m x 2m x 2.5m kiosk diagram"},
  {"id":"benefits","eyebrow":"Location Owner Benefits","title":"A Ready-Made Food Attraction","body":"Adds a strong local food category, activates unused space, increases dwell time, and creates a photo-friendly tenant.","visual":"Partner benefit cards"},
  {"id":"rollout","eyebrow":"Expansion Plan","title":"Alexandria First. Egypt Next.","body":"The rollout starts with dense Alexandria coverage, then expands into clubs, malls, campuses, hypermarkets, and compounds.","visual":"Interactive location map"},
  {"id":"cta","eyebrow":"Next Step","title":"Start the Partnership Conversation","body":"Download the current partner presentation, request a tasting session, or submit your location for assessment.","visual":"Partner deck and next actions"}
]';
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
