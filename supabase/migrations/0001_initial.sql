create extension if not exists pgcrypto;

create type public.staff_role as enum ('admin', 'cajero', 'cocina', 'barra');
create type public.table_status as enum (
  'available',
  'occupied',
  'awaiting_payment',
  'closed'
);
create type public.table_session_status as enum (
  'open',
  'awaiting_payment',
  'paid',
  'cancelled'
);
create type public.preparation_area as enum ('cocina', 'barra');
create type public.order_item_status as enum (
  'cart',
  'pending',
  'accepted',
  'in_progress',
  'ready',
  'delivered',
  'unavailable',
  'cancelled'
);
create type public.payment_provider as enum ('mercadopago', 'offline');
create type public.payment_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);
create type public.actor_type as enum ('diner', 'staff', 'system');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.staff_role not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number > 0),
  name text not null,
  capacity integer not null default 4 check (capacity > 0),
  pos_x numeric(8, 2) not null default 0,
  pos_y numeric(8, 2) not null default 0,
  status public.table_status not null default 'available',
  current_session_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables (id) on delete restrict,
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  status public.table_session_status not null default 'open'
);

alter table public.tables
add constraint tables_current_session_id_fkey
foreign key (current_session_id)
references public.table_sessions (id)
on delete set null;

create unique index tables_current_session_id_key
  on public.tables (current_session_id)
  where current_session_id is not null;

create unique index table_sessions_one_active_session_per_table_idx
  on public.table_sessions (table_id)
  where status in ('open', 'awaiting_payment');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.table_sessions (id) on delete cascade,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tip numeric(12, 2) not null default 0 check (tip >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  preparation_area public.preparation_area not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name_snapshot text not null,
  price_snapshot numeric(12, 2) not null check (price_snapshot >= 0),
  qty integer not null check (qty between 1 and 99),
  notes text,
  status public.order_item_status not null default 'cart',
  area public.preparation_area not null,
  added_by_staff_id uuid references public.staff_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz
);

create table public.order_item_events (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  from_status public.order_item_status,
  to_status public.order_item_status not null,
  actor_type public.actor_type not null,
  actor_id uuid,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.table_sessions (id) on delete restrict,
  provider public.payment_provider not null,
  external_id text,
  amount numeric(12, 2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index payments_external_id_unique_idx
  on public.payments (external_id)
  where external_id is not null;

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_type public.actor_type not null,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.restaurant_config (
  id integer primary key check (id = 1),
  name text not null,
  mp_access_token text,
  mp_public_key text,
  tip_options jsonb not null default '[0, 10, 15]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.restaurant_config (id, name)
values (1, 'MesaQR')
on conflict (id) do nothing;

create index table_sessions_table_id_status_idx
  on public.table_sessions (table_id, status);

create index menu_categories_active_sort_idx
  on public.menu_categories (active, sort_order);

create index menu_items_category_available_sort_idx
  on public.menu_items (category_id, available, sort_order);

create index order_items_order_status_idx
  on public.order_items (order_id, status);

create index order_items_area_status_created_idx
  on public.order_items (area, status, created_at);

create index order_item_events_item_created_idx
  on public.order_item_events (order_item_id, created_at);

create index payments_session_status_idx
  on public.payments (session_id, status);

create index audit_log_entity_created_idx
  on public.audit_log (entity, entity_id, created_at desc);

create trigger set_tables_updated_at
before update on public.tables
for each row
execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create trigger set_menu_categories_updated_at
before update on public.menu_categories
for each row
execute function public.set_updated_at();

create trigger set_menu_items_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

create trigger set_restaurant_config_updated_at
before update on public.restaurant_config
for each row
execute function public.set_updated_at();

alter table public.staff_users enable row level security;
alter table public.tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_events enable row level security;
alter table public.payments enable row level security;
alter table public.audit_log enable row level security;
alter table public.restaurant_config enable row level security;

create policy "Public menu categories are readable"
on public.menu_categories
for select
to anon, authenticated
using (active = true);

create policy "Public menu items are readable"
on public.menu_items
for select
to anon, authenticated
using (
  available = true
  and exists (
    select 1
    from public.menu_categories
    where public.menu_categories.id = public.menu_items.category_id
      and public.menu_categories.active = true
  )
);

create policy "Staff users can read their own profile"
on public.staff_users
for select
to authenticated
using (auth.uid() = id);
