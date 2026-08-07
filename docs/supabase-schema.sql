-- ============================================
-- CampusAuthGuard - Production Supabase Schema
-- ============================================

-- ============================================
-- 1. COLLEGES
-- ============================================
create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- e.g. 'st-vincent-pallotti'
  name text not null,
  created_at timestamptz default now()
);

alter table colleges enable row level security;

-- Anyone (including anon extension) can read college list
drop policy if exists "colleges_public_read" on colleges;
create policy "colleges_public_read" on colleges
  for select using (true);


-- ============================================
-- 2. ADMIN PROFILES (extends auth.users)
-- ============================================
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  college_id uuid references colleges(id),
  role text not null default 'college_admin'
    check (role in ('super_admin', 'college_admin')),
  created_at timestamptz default now()
);

alter table admin_profiles enable row level security;

-- Helper function to check super_admin WITHOUT causing recursive RLS lookups
create or replace function is_super_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Admin can read their own profile
drop policy if exists "profiles_self_read" on admin_profiles;
create policy "profiles_self_read" on admin_profiles
  for select using (auth.uid() = id);

-- Super admin can read everyone's profile
drop policy if exists "profiles_super_admin_read_all" on admin_profiles;
create policy "profiles_super_admin_read_all" on admin_profiles
  for select using (is_super_admin());


-- ============================================
-- 3. FINGERPRINTS (the core table)
-- ============================================
create table if not exists fingerprints (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  portal_type text not null default 'erp'
    check (portal_type in ('erp', 'webmail', 'scholarship', 'library', 'exam')),
  college_name text not null,
  official_domains text[] not null,
  page_title text,
  brand_keywords text[],
  form_fingerprint jsonb not null,
  dom_fingerprint jsonb not null,
  visual_fingerprint jsonb not null,
  version int not null default 1,
  is_published boolean not null default false,   -- extension only sees published=true
  created_by uuid references admin_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (college_id, portal_type)
);

alter table fingerprints enable row level security;

-- PUBLIC (extension, anon key): can only read PUBLISHED fingerprints
drop policy if exists "fingerprints_public_read_published" on fingerprints;
create policy "fingerprints_public_read_published" on fingerprints
  for select using (is_published = true);

-- Admin: can read their own college's fingerprints (published or draft)
drop policy if exists "fingerprints_admin_read_own" on fingerprints;
create policy "fingerprints_admin_read_own" on fingerprints
  for select using (
    is_super_admin() or
    exists (select 1 from admin_profiles p where p.id = auth.uid() and p.college_id = fingerprints.college_id)
  );

-- Admin: can insert only for their own college
drop policy if exists "fingerprints_admin_insert_own" on fingerprints;
create policy "fingerprints_admin_insert_own" on fingerprints
  for insert with check (
    is_super_admin() or
    exists (select 1 from admin_profiles p where p.id = auth.uid() and p.college_id = college_id)
  );

-- Admin: can update only their own college's rows
drop policy if exists "fingerprints_admin_update_own" on fingerprints;
create policy "fingerprints_admin_update_own" on fingerprints
  for update using (
    is_super_admin() or
    exists (select 1 from admin_profiles p where p.id = auth.uid() and p.college_id = fingerprints.college_id)
  );

-- Delete: super_admin only (safety — accidental deletes by college admin shouldn't be possible)
drop policy if exists "fingerprints_delete_super_only" on fingerprints;
create policy "fingerprints_delete_super_only" on fingerprints
  for delete using (is_super_admin());


-- ============================================
-- 4. AUDIT LOG (auto-filled via trigger)
-- ============================================
create table if not exists fingerprint_audit_log (
  id uuid primary key default gen_random_uuid(),
  fingerprint_id uuid references fingerprints(id) on delete cascade,
  changed_by uuid references admin_profiles(id),
  action text not null check (action in ('created', 'updated')),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz default now()
);

alter table fingerprint_audit_log enable row level security;

drop policy if exists "audit_log_admin_read_own" on fingerprint_audit_log;
create policy "audit_log_admin_read_own" on fingerprint_audit_log
  for select using (
    is_super_admin() or
    exists (
      select 1 from admin_profiles p
      join fingerprints f on f.id = fingerprint_audit_log.fingerprint_id
      where p.id = auth.uid() and p.college_id = f.college_id
    )
  );

-- Trigger function: auto-logs every insert/update, runs with elevated rights
create or replace function log_fingerprint_change()
returns trigger language plpgsql security definer as $$
begin
  insert into fingerprint_audit_log (fingerprint_id, changed_by, action, old_data, new_data)
  values (
    coalesce(new.id, old.id),
    auth.uid(),
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists trg_fingerprint_audit on fingerprints;
create trigger trg_fingerprint_audit
after insert or update on fingerprints
for each row execute function log_fingerprint_change();


-- ============================================
-- 5. SCAN EVENTS (analytics dashboard for extension & admins)
-- ============================================
create table if not exists scan_events (
  id uuid primary key default gen_random_uuid(),
  fingerprint_id uuid references fingerprints(id),
  detected_domain text,
  similarity_score int,
  risk_level text check (risk_level in ('safe','suspicious','dangerous')),
  created_at timestamptz default now()
);

alter table scan_events enable row level security;

-- Extension can log anonymously (no personal data, just domain+score)
drop policy if exists "scan_events_public_insert" on scan_events;
create policy "scan_events_public_insert" on scan_events
  for insert with check (true);

-- Only relevant college admin can view their scan stats
drop policy if exists "scan_events_admin_read" on scan_events;
create policy "scan_events_admin_read" on scan_events
  for select using (
    is_super_admin() or
    exists (
      select 1 from admin_profiles p
      join fingerprints f on f.id = scan_events.fingerprint_id
      where p.id = auth.uid() and p.college_id = f.college_id
    )
  );


-- ============================================
-- 6. SEED INITIAL COLLEGES & PUBLISHED FINGERPRINTS
-- ============================================

-- Seed 1: St. Vincent Pallotti College
insert into colleges (slug, name)
values ('st-vincent-pallotti', 'St. Vincent Pallotti College of Engineering and Technology')
on conflict (slug) do nothing;

insert into fingerprints (
  college_id,
  portal_type,
  college_name,
  official_domains,
  page_title,
  brand_keywords,
  form_fingerprint,
  dom_fingerprint,
  visual_fingerprint,
  is_published
)
select 
  c.id,
  'erp',
  'St. Vincent Pallotti College of Engineering and Technology',
  array['stvincentngp.edu.in', 'erp.stvincentngp.edu.in'],
  'log-CAS_ERP',
  array['St. Vincent Pallotti', 'Student Login', 'ERP Portal', 'Student Portal'],
  '{
    "passwordFieldCount": 1,
    "emailFieldCount": 0,
    "inputCount": 14,
    "buttonTexts": ["Login", "Reset"],
    "placeholders": ["Username", "Password"]
  }'::jsonb,
  '{
    "inputTypes": ["hidden", "text", "password", "submit"],
    "formAction": "./login.aspx",
    "formMethod": "POST"
  }'::jsonb,
  '{
    "layoutType": "centered-login-card",
    "dominantColors": ["#ffffff"],
    "logoAltText": "",
    "headingText": "College Administration System"
  }'::jsonb,
  true
from colleges c where c.slug = 'st-vincent-pallotti'
on conflict (college_id, portal_type) do update
set is_published = true,
    official_domains = excluded.official_domains,
    form_fingerprint = excluded.form_fingerprint,
    dom_fingerprint = excluded.dom_fingerprint,
    visual_fingerprint = excluded.visual_fingerprint;

-- Seed 2: YCCE
insert into colleges (slug, name)
values ('ycce', 'Yeshwantrao Chavan College of Engineering (YCCE)')
on conflict (slug) do nothing;

insert into fingerprints (
  college_id,
  portal_type,
  college_name,
  official_domains,
  page_title,
  brand_keywords,
  form_fingerprint,
  dom_fingerprint,
  visual_fingerprint,
  is_published
)
select 
  c.id,
  'erp',
  'YCCE',
  array['studentserp.ycce.edu'],
  'Authentication Portal',
  array['ERP', 'YCCE'],
  '{
    "passwordFieldCount": 1,
    "emailFieldCount": 1,
    "inputCount": 3,
    "buttonTexts": ["Login"],
    "placeholders": ["Username", "Password"]
  }'::jsonb,
  '{
    "forms_count": 1,
    "inputs_count": 3,
    "password_fields_detected": 1,
    "has_csrf_token": true
  }'::jsonb,
  '{
    "primary_color": "#C9622B",
    "logo_resemblance_hash": "hash_vp_99831",
    "font_families": ["Space Grotesk", "sans-serif"]
  }'::jsonb,
  true
from colleges c where c.slug = 'ycce'
on conflict (college_id, portal_type) do update
set is_published = true,
    official_domains = excluded.official_domains,
    form_fingerprint = excluded.form_fingerprint,
    dom_fingerprint = excluded.dom_fingerprint,
    visual_fingerprint = excluded.visual_fingerprint;
