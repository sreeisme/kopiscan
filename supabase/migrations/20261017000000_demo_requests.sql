-- Demo requests from the public home page form. Written only by server code (service role)
-- after zod + rate limiting; platform admins can read them.
create table demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  restaurant text not null check (char_length(restaurant) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  phone text not null default '' check (char_length(phone) <= 40),
  message text not null default '' check (char_length(message) <= 1000),
  emailed boolean not null default false,
  created_at timestamptz not null default now()
);
create index on demo_requests (created_at desc);

alter table demo_requests enable row level security;
revoke all on demo_requests from anon;
revoke insert, update, delete on demo_requests from authenticated;

create policy "demo_requests admin read" on demo_requests for select to authenticated
  using (is_platform_admin());
