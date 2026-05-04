
-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Admins view roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Departments
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
alter table public.departments enable row level security;
create policy "Public read departments" on public.departments for select using (true);
create policy "Admins write departments" on public.departments for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Discount tiers
create table public.discount_tiers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.discount_tiers enable row level security;
create policy "Public read discount_tiers" on public.discount_tiers for select using (true);
create policy "Admins write discount_tiers" on public.discount_tiers for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Price tiers
create table public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.price_tiers enable row level security;
create policy "Public read price_tiers" on public.price_tiers for select using (true);
create policy "Admins write price_tiers" on public.price_tiers for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Affiliate links
create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  dept_id uuid not null references public.departments(id) on delete cascade,
  discount_range text not null,
  price_range text not null,
  affiliate_url text not null,
  created_at timestamptz not null default now(),
  unique (dept_id, discount_range, price_range)
);
alter table public.affiliate_links enable row level security;
create policy "Public read affiliate_links" on public.affiliate_links for select using (true);
create policy "Admins write affiliate_links" on public.affiliate_links for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- App settings
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "Public read app_settings" on public.app_settings for select using (true);
create policy "Admins write app_settings" on public.app_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Seed
insert into public.discount_tiers (label, value, sort_order) values
  ('Any','any',0),('10%+','10',1),('25%+','25',2),('50%+','50',3),('70%+','70',4);

insert into public.price_tiers (label, value, sort_order) values
  ('$Any','any',0),('Under $15','15',1),('Under $30','30',2),('Under $100','100',3),('Under $200','200',4);

insert into public.departments (name) values
  ('Electronics'),('Books'),('Home & Kitchen'),('Toys'),('Fashion');

insert into public.app_settings (key, value) values
  ('fallback_url','https://www.amazon.com/deals');
