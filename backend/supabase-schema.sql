-- Supabase/Postgres schema for Chillingan backend

create table if not exists users (
  id text primary key,
  email text unique not null,
  password text not null,
  name text not null,
  phone text,
  address text,
  profile_image text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  description text not null,
  price numeric not null,
  category text not null,
  image_url text not null,
  rating numeric not null,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reservation_units (
  id text primary key,
  service_id text not null,
  name text not null,
  description text not null,
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reservations (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  date text not null,
  time text not null,
  party_size integer not null check (party_size > 0),
  unit_id text,
  unit_name text,
  service_id text,
  special_requests text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null,
  total numeric not null,
  delivery_address text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'shipped', 'delivered')),
  created_at timestamptz not null default now(),
  estimated_delivery_time text not null,
  accepted_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  rejection_reason text,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists admin_settings (
  key text primary key,
  value jsonb not null
);

create table if not exists support_chat_requests (
  id text primary key,
  status text not null check (status in ('waiting', 'connected', 'closed')),
  customer_messages jsonb not null,
  admin_messages jsonb not null,
  requested_at bigint not null,
  updated_at bigint not null
);

create table if not exists walkins (
  id text primary key,
  date text not null,
  start_time text not null,
  end_time text not null,
  unit_id text,
  unit_name text,
  service_id text not null,
  service_name text not null,
  payment_amount numeric not null,
  amount_received numeric not null,
  change_amount numeric not null,
  payment_method text not null check (payment_method in ('cash','card','gcash','other')),
  customer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservations_user_id on reservations(user_id);
create index if not exists idx_reservations_date on reservations(date);
create index if not exists idx_reservations_status on reservations(status);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_visible on products(visible);
create index if not exists idx_reservation_units_service_id on reservation_units(service_id);
create index if not exists idx_reservation_units_active on reservation_units(active);
