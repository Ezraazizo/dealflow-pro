-- ============================================================
-- DealFlow Pro — Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ─────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── ORGANIZATIONS (for multi-user / team access) ───────────
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.org_members (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;

create policy "Org members can view org"
  on public.organizations for select
  using (id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "Org members can view members"
  on public.org_members for select
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));


-- ─── DEALS ──────────────────────────────────────────────────
create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id),

  -- Core info
  name text not null,
  address text,
  deal_type text not null check (deal_type in ('Acquisition', 'Development / Ground-Up')),
  stage text not null default 'Sourcing' check (stage in ('Sourcing', 'LOI', 'Due Diligence', 'Contract', 'Closing')),
  status text not null default 'prospective' check (status in ('prospective', 'hot', 'warm', 'cold', 'on_hold', 'about_to_close', 'dead', 'closed_won')),

  -- Financials
  asking_price numeric(15,2) default 0,
  purchase_price numeric(15,2) default 0,
  noi numeric(15,2) default 0,
  cap_rate numeric(6,3) default 0,
  cash_on_cash numeric(6,3) default 0,
  units integer default 0,
  sqft integer default 0,
  ltv numeric(5,2) default 0,
  interest_rate numeric(6,4) default 0,
  amortization integer default 0,
  irr numeric(6,2) default 0,
  equity_multiple numeric(6,2) default 0,
  tax_assessment numeric(15,2) default 0,

  -- Notes
  notes text default '',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.deals enable row level security;

create policy "Org members can view deals"
  on public.deals for select
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "Org members can insert deals"
  on public.deals for insert
  with check (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "Org members can update deals"
  on public.deals for update
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "Admins can delete deals"
  on public.deals for delete
  using (org_id in (
    select org_id from public.org_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- Index for fast lookups
create index idx_deals_org_id on public.deals(org_id);
create index idx_deals_stage on public.deals(stage);
create index idx_deals_status on public.deals(status);


-- ─── CONTACTS ───────────────────────────────────────────────
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  role text not null check (role in (
    'Broker', 'Attorney', 'Lender / Mortgage Broker', 'Title Company',
    'Property Manager', 'Investor / Partner', 'Government (HPD, DOB, DOF)'
  )),
  company text,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now()
);

-- Junction table: contacts ↔ deals (many-to-many)
create table public.deal_contacts (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(deal_id, contact_id)
);

alter table public.contacts enable row level security;
alter table public.deal_contacts enable row level security;

create policy "Org members can view contacts"
  on public.contacts for select
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "Org members can manage contacts"
  on public.contacts for all
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "Org members can view deal_contacts"
  on public.deal_contacts for select
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "Org members can manage deal_contacts"
  on public.deal_contacts for all
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));


-- ─── CHECKLIST ITEMS ────────────────────────────────────────
create table public.checklist_items (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  text text not null,
  is_done boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.checklist_items enable row level security;

create policy "Org members can view checklist"
  on public.checklist_items for select
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "Org members can manage checklist"
  on public.checklist_items for all
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create index idx_checklist_deal_id on public.checklist_items(deal_id);


-- ─── DEADLINES ──────────────────────────────────────────────
create table public.deadlines (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  title text not null,
  due_date date not null,
  is_done boolean default false,
  notify_days_before integer default 3,
  created_at timestamptz default now()
);

alter table public.deadlines enable row level security;

create policy "Org members can view deadlines"
  on public.deadlines for select
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "Org members can manage deadlines"
  on public.deadlines for all
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create index idx_deadlines_deal_id on public.deadlines(deal_id);
create index idx_deadlines_due_date on public.deadlines(due_date);


-- ─── DOCUMENTS ──────────────────────────────────────────────
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  file_name text not null,
  file_path text not null, -- path in Supabase Storage
  file_size integer,
  mime_type text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Org members can view documents"
  on public.documents for select
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "Org members can manage documents"
  on public.documents for all
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));


-- ─── ACTIVITY LOG ───────────────────────────────────────────
create table public.activity_log (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null, -- 'created', 'updated_stage', 'uploaded_doc', etc.
  details jsonb,
  created_at timestamptz default now()
);

alter table public.activity_log enable row level security;

create policy "Org members can view activity"
  on public.activity_log for select
  using (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "Org members can log activity"
  on public.activity_log for insert
  with check (deal_id in (select id from public.deals where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));


-- ─── EMAIL DIGEST PREFERENCES ───────────────────────────────
create table public.notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  email_digest boolean default true,
  digest_frequency text default 'daily' check (digest_frequency in ('daily', 'weekly')),
  digest_day integer default 1, -- 1=Monday for weekly
  digest_time time default '08:00',
  created_at timestamptz default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can manage own preferences"
  on public.notification_preferences for all
  using (user_id = auth.uid());


-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at before update on public.deals
  for each row execute procedure update_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure update_updated_at();


-- ─── STORAGE BUCKET FOR DOCUMENTS ───────────────────────────
insert into storage.buckets (id, name, public)
values ('deal-documents', 'deal-documents', false);

create policy "Authenticated users can upload docs"
  on storage.objects for insert
  with check (bucket_id = 'deal-documents' and auth.role() = 'authenticated');

create policy "Authenticated users can view docs"
  on storage.objects for select
  using (bucket_id = 'deal-documents' and auth.role() = 'authenticated');

create policy "Authenticated users can delete own docs"
  on storage.objects for delete
  using (bucket_id = 'deal-documents' and auth.role() = 'authenticated');
