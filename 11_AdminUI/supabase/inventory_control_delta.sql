-- Inventory Control schema delta
-- Safe to run multiple times in Supabase SQL Editor.

create table if not exists inventory_items (
  id                  text primary key,
  sku                 text not null default '',
  name                text not null,
  category            text not null default 'raw',
  unit                text not null,
  on_hand             numeric not null default 0,
  par_level           numeric not null default 0,
  reorder_point       numeric not null default 0,
  unit_cost_egp       numeric not null default 0,
  supplier            text not null default '',
  storage_location    text not null default '',
  linked_menu_item_id text not null default '',
  notes               text not null default '',
  is_active           boolean not null default true,
  created_at          text not null,
  updated_at          text not null
);

create table if not exists inventory_movements (
  id            text primary key,
  item_id       text not null references inventory_items(id) on delete cascade,
  type          text not null,
  quantity      numeric not null default 0,
  delta         numeric not null default 0,
  before_qty    numeric not null default 0,
  after_qty     numeric not null default 0,
  unit_cost_egp numeric not null default 0,
  note          text not null default '',
  created_at    text not null,
  created_by    text not null default 'admin'
);

create index if not exists inventory_items_category_idx on inventory_items(category);
create index if not exists inventory_items_active_idx on inventory_items(is_active);
create index if not exists inventory_movements_item_idx on inventory_movements(item_id);
create index if not exists inventory_movements_created_idx on inventory_movements(created_at desc);

insert into inventory_items (
  id,
  sku,
  name,
  category,
  unit,
  on_hand,
  par_level,
  reorder_point,
  unit_cost_egp,
  supplier,
  storage_location,
  linked_menu_item_id,
  notes,
  is_active,
  created_at,
  updated_at
) values
  (
    'inv_grape_leaves',
    'MZ-RAW-0001',
    'Grape leaves',
    'raw',
    'kg',
    18,
    30,
    12,
    95,
    'Alexandria Produce Market',
    'Cold storage',
    'itm_stuffy_grape',
    'Primary driver for grape leaf rolls.',
    true,
    '2026-06-05T00:00:00.000Z',
    '2026-06-05T00:00:00.000Z'
  ),
  (
    'inv_rice',
    'MZ-RAW-0002',
    'Egyptian rice',
    'raw',
    'kg',
    42,
    50,
    20,
    38,
    'Staples wholesaler',
    'Dry store',
    '',
    '',
    true,
    '2026-06-05T00:00:00.000Z',
    '2026-06-05T00:00:00.000Z'
  ),
  (
    'inv_takeaway_boxes',
    'MZ-PKG-0001',
    'Takeaway boxes',
    'packaging',
    'pcs',
    320,
    500,
    150,
    4.5,
    'Packaging supplier',
    'Back shelf',
    '',
    'Branded box v2.',
    true,
    '2026-06-05T00:00:00.000Z',
    '2026-06-05T00:00:00.000Z'
  )
on conflict (id) do nothing;
