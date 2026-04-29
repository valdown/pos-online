-- Legacy helper for internal owner auth bootstrap on older existing databases.
-- If you already ran `../schema.sql` from the current repo state, you usually do not need this file.
-- IMPORTANT: replace the default bootstrap password immediately after first login.

create table if not exists public.staff_credentials (
  staff_id text primary key references public.staff_members (id) on delete cascade,
  password_hash text not null,
  is_owner boolean not null default false,
  is_active boolean not null default true,
  password_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_id text not null references public.staff_members (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_sessions_staff_id on public.app_sessions (staff_id);
create index if not exists idx_app_sessions_expires_at on public.app_sessions (expires_at);

alter table public.staff_credentials enable row level security;
alter table public.app_sessions enable row level security;

update public.staff_members
set email = 'owner@coffeebean.local', access = 'Penuh'
where id = 'stf-001';

insert into public.staff_credentials (staff_id, password_hash, is_owner, is_active)
values ('stf-001', crypt('coffeebean', gen_salt('bf', 12)), true, true)
on conflict (staff_id)
do update set
  password_hash = excluded.password_hash,
  is_owner = true,
  is_active = true,
  updated_at = now(),
  password_updated_at = now();
