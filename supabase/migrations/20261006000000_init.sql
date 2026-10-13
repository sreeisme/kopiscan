-- Menuly initial schema: tenancy, menu, tables, sessions, orders, service requests,
-- plan limits, rate limiting, RLS, realtime and storage.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type plan_tier as enum ('basic', 'pro', 'premium');
create type restaurant_status as enum ('active', 'trial', 'suspended');
create type member_role as enum ('owner', 'staff');
create type order_status as enum ('new', 'acknowledged', 'done', 'cancelled');
create type request_type as enum ('call_waiter', 'bill');
create type request_status as enum ('open', 'done');

-- ---------------------------------------------------------------------------
-- Plans (mirrors src/lib/plans.ts — a unit test asserts parity). null = unlimited
-- ---------------------------------------------------------------------------
create table plan_limits (
  plan plan_tier primary key,
  max_tables int,
  max_items int,
  max_staff int
);
insert into plan_limits values
  ('basic', 10, 60, 2),
  ('pro', 30, 250, 5),
  ('premium', null, null, 15);

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  name text not null check (char_length(name) between 1 and 80),
  plan plan_tier not null default 'basic',
  status restaurant_status not null default 'active',
  theme jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role member_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);
create index on memberships (restaurant_id);

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------
create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort int not null default 0,
  visible boolean not null default true,
  translations jsonb not null default '{}'::jsonb
);
create index on menu_categories (restaurant_id, sort);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references menu_categories(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  price_cents int not null check (price_cents between 0 and 1000000),
  image_path text,
  tags text[] not null default '{}',
  available boolean not null default true,
  sort int not null default 0,
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on menu_items (restaurant_id, category_id, sort);

create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  item_id uuid not null references menu_items(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  min_select int not null default 0 check (min_select >= 0),
  max_select int not null default 1 check (max_select >= 1),
  sort int not null default 0,
  check (min_select <= max_select)
);
create index on modifier_groups (item_id);

create table modifier_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  group_id uuid not null references modifier_groups(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  price_delta_cents int not null default 0 check (price_delta_cents between -100000 and 100000),
  available boolean not null default true,
  sort int not null default 0
);
create index on modifier_options (group_id);

-- ---------------------------------------------------------------------------
-- Tables & sessions
-- ---------------------------------------------------------------------------
create or replace function gen_qr_token() returns text
language sql volatile set search_path = public, extensions as $$
  select translate(encode(gen_random_bytes(16), 'base64'), '+/=', '-_')
$$;

create table tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 20),
  qr_token text not null unique default gen_qr_token(),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (restaurant_id, label)
);

create table table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 hours',
  closed_at timestamptz,
  ip_hash text,
  ua_hash text
);
create index on table_sessions (table_id) where closed_at is null;

-- ---------------------------------------------------------------------------
-- Orders & service requests
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete cascade,
  session_id uuid not null references table_sessions(id) on delete cascade,
  table_label text not null,
  status order_status not null default 'new',
  subtotal_cents int not null check (subtotal_cents >= 0),
  note text not null default '' check (char_length(note) <= 300),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  done_at timestamptz,
  unique (session_id, idempotency_key)
);
create index on orders (restaurant_id, created_at desc);
create index on orders (restaurant_id, status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  item_id uuid references menu_items(id) on delete set null,
  name text not null,
  unit_price_cents int not null,
  qty int not null check (qty between 1 and 20),
  modifiers jsonb not null default '[]'::jsonb,
  line_total_cents int not null
);
create index on order_items (order_id);
create index on order_items (restaurant_id);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete cascade,
  session_id uuid references table_sessions(id) on delete set null,
  table_label text not null,
  type request_type not null,
  status request_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
-- one open request per type per table
create unique index service_requests_one_open on service_requests (table_id, type) where status = 'open';
create index on service_requests (restaurant_id, status);

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Called only with the service role.
-- ---------------------------------------------------------------------------
create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

create or replace function hit_rate_limit(p_key text, p_limit int, p_window_secs int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_secs) * p_window_secs);
  c int;
begin
  insert into rate_limits (key, window_start, count) values (p_key, w, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into c;
  -- opportunistic cleanup
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;
  return c <= p_limit;
end $$;
revoke all on function hit_rate_limit(text, int, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$;

create or replace function is_member(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = auth.uid() and restaurant_id = rid)
    or is_platform_admin()
$$;

create or replace function is_owner(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = auth.uid() and restaurant_id = rid and role = 'owner')
    or is_platform_admin()
$$;

-- ---------------------------------------------------------------------------
-- Plan limit triggers (defense in depth; server actions check first)
-- ---------------------------------------------------------------------------
create or replace function enforce_plan_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lim int;
  cnt int;
  p plan_tier;
begin
  select plan into p from restaurants where id = new.restaurant_id;
  if tg_table_name = 'tables' then
    select max_tables into lim from plan_limits where plan = p;
    select count(*) into cnt from tables where restaurant_id = new.restaurant_id;
  elsif tg_table_name = 'menu_items' then
    select max_items into lim from plan_limits where plan = p;
    select count(*) into cnt from menu_items where restaurant_id = new.restaurant_id;
  elsif tg_table_name = 'memberships' then
    if new.role <> 'staff' then return new; end if;
    select max_staff into lim from plan_limits where plan = p;
    select count(*) into cnt from memberships where restaurant_id = new.restaurant_id and role = 'staff';
  end if;
  if lim is not null and cnt >= lim then
    raise exception 'PLAN_LIMIT: % limit (%) reached for plan %', tg_table_name, lim, p
      using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger tables_plan_limit before insert on tables
  for each row execute function enforce_plan_limit();
create trigger menu_items_plan_limit before insert on menu_items
  for each row execute function enforce_plan_limit();
create trigger memberships_plan_limit before insert on memberships
  for each row execute function enforce_plan_limit();

-- ---------------------------------------------------------------------------
-- Status timestamps
-- ---------------------------------------------------------------------------
create or replace function stamp_order_status() returns trigger
language plpgsql as $$
begin
  if new.status = 'acknowledged' and old.status = 'new' then new.acknowledged_at := now(); end if;
  if new.status = 'done' and old.status <> 'done' then
    new.done_at := now();
    if new.acknowledged_at is null then new.acknowledged_at := now(); end if;
  end if;
  return new;
end $$;
create trigger orders_stamp before update on orders
  for each row execute function stamp_order_status();

create or replace function stamp_request_status() returns trigger
language plpgsql as $$
begin
  if new.status = 'done' and old.status = 'open' then new.resolved_at := now(); end if;
  return new;
end $$;
create trigger service_requests_stamp before update on service_requests
  for each row execute function stamp_request_status();

-- ---------------------------------------------------------------------------
-- RLS. anon gets nothing: diner traffic goes through server code (service role).
-- ---------------------------------------------------------------------------
alter table plan_limits enable row level security;
alter table restaurants enable row level security;
alter table platform_admins enable row level security;
alter table memberships enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table modifier_groups enable row level security;
alter table modifier_options enable row level security;
alter table tables enable row level security;
alter table table_sessions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table service_requests enable row level security;
alter table rate_limits enable row level security;

revoke all on all tables in schema public from anon;

create policy "plan_limits read" on plan_limits for select to authenticated using (true);

create policy "restaurants member read" on restaurants for select to authenticated using (is_member(id));
create policy "restaurants owner update" on restaurants for update to authenticated
  using (is_owner(id)) with check (is_owner(id));

create policy "platform_admins self read" on platform_admins for select to authenticated
  using (user_id = auth.uid());

create policy "memberships read" on memberships for select to authenticated
  using (user_id = auth.uid() or is_owner(restaurant_id));
create policy "memberships owner write" on memberships for all to authenticated
  using (is_owner(restaurant_id)) with check (is_owner(restaurant_id));

-- Menu & tables: members read, owners write
do $$
declare t text;
begin
  foreach t in array array['menu_categories','menu_items','modifier_groups','modifier_options','tables'] loop
    execute format('create policy "%1$s member read" on %1$I for select to authenticated using (is_member(restaurant_id))', t);
    execute format('create policy "%1$s owner write" on %1$I for all to authenticated using (is_owner(restaurant_id)) with check (is_owner(restaurant_id))', t);
  end loop;
end $$;

create policy "sessions member read" on table_sessions for select to authenticated using (is_member(restaurant_id));
create policy "sessions member update" on table_sessions for update to authenticated
  using (is_member(restaurant_id)) with check (is_member(restaurant_id));

create policy "orders member read" on orders for select to authenticated using (is_member(restaurant_id));
create policy "orders member update" on orders for update to authenticated
  using (is_member(restaurant_id)) with check (is_member(restaurant_id));

create policy "order_items member read" on order_items for select to authenticated using (is_member(restaurant_id));

create policy "requests member read" on service_requests for select to authenticated using (is_member(restaurant_id));
create policy "requests member update" on service_requests for update to authenticated
  using (is_member(restaurant_id)) with check (is_member(restaurant_id));

-- Staff may only change status columns on orders / requests
revoke update on orders from authenticated;
grant update (status) on orders to authenticated;
revoke update on service_requests from authenticated;
grant update (status) on service_requests to authenticated;
revoke update on table_sessions from authenticated;
grant update (closed_at) on table_sessions to authenticated;
-- Owners may edit name/theme/settings; plan & status only via service role (admin panel)
revoke insert, update, delete on restaurants from authenticated;
grant update (name, theme, settings) on restaurants to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table service_requests;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket, path = <restaurant_id>/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-assets', 'menu-assets', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "menu-assets owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-assets' and is_owner(((storage.foldername(name))[1])::uuid));
create policy "menu-assets owner update" on storage.objects for update to authenticated
  using (bucket_id = 'menu-assets' and is_owner(((storage.foldername(name))[1])::uuid));
create policy "menu-assets owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'menu-assets' and is_owner(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------------------
-- Atomic order placement (called by the server with the service role after
-- session validation, rate limiting and server-side pricing).
-- Idempotent on (session_id, idempotency_key): returns the existing order id.
-- ---------------------------------------------------------------------------
create or replace function place_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  oid uuid;
begin
  select id into oid from orders
   where session_id = (p_order->>'session_id')::uuid
     and idempotency_key = p_order->>'idempotency_key';
  if oid is not null then return oid; end if;

  insert into orders (restaurant_id, table_id, session_id, table_label, subtotal_cents, note, idempotency_key)
  values (
    (p_order->>'restaurant_id')::uuid,
    (p_order->>'table_id')::uuid,
    (p_order->>'session_id')::uuid,
    p_order->>'table_label',
    (p_order->>'subtotal_cents')::int,
    coalesce(p_order->>'note', ''),
    p_order->>'idempotency_key'
  )
  on conflict (session_id, idempotency_key) do nothing
  returning id into oid;

  if oid is null then
    -- lost a race with an identical concurrent submit
    select id into oid from orders
     where session_id = (p_order->>'session_id')::uuid
       and idempotency_key = p_order->>'idempotency_key';
    return oid;
  end if;

  insert into order_items (order_id, restaurant_id, item_id, name, unit_price_cents, qty, modifiers, line_total_cents)
  select oid, (p_order->>'restaurant_id')::uuid, (i->>'item_id')::uuid, i->>'name',
         (i->>'unit_price_cents')::int, (i->>'qty')::int, coalesce(i->'modifiers', '[]'::jsonb),
         (i->>'line_total_cents')::int
    from jsonb_array_elements(p_items) as i;

  return oid;
end $$;
revoke all on function place_order(jsonb, jsonb) from public, anon, authenticated;
