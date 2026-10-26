-- 0001_tenancy: tenant, keanggotaan, lokasi, pengaturan, audit + helper RLS + create_tenant.
-- Idempoten: aman diterapkan berulang.

-- ---------- fungsi umum ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- tabel ----------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'kasir', 'staf_stok')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships (user_id);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists locations_one_default_idx
  on public.locations (tenant_id) where is_default;

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  timezone text not null default 'Asia/Jakarta',
  kasir_discount_limit integer not null default 0 check (kasir_discount_limit >= 0),
  receipt_prefix text not null default 'STR' check (receipt_prefix ~ '^[A-Z0-9]{2,8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_tenant_idx on public.audit_events (tenant_id, created_at desc);

create or replace trigger tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
create or replace trigger memberships_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();
create or replace trigger locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();
create or replace trigger tenant_settings_updated_at before update on public.tenant_settings
  for each row execute function public.set_updated_at();

-- ---------- helper RLS (hanya keanggotaan aktif) ----------
create or replace function public.is_member(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid() and m.status = 'active'
  )
$$;

create or replace function public.has_role(p_tenant_id uuid, p_roles text[]) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid()
      and m.status = 'active' and m.role = any (p_roles)
  )
$$;

-- ---------- RLS ----------
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.locations enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants for select to authenticated
  using (public.is_member(id));

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated
  using (public.is_member(tenant_id));

drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations for select to authenticated
  using (public.is_member(tenant_id));

drop policy if exists tenant_settings_select on public.tenant_settings;
create policy tenant_settings_select on public.tenant_settings for select to authenticated
  using (public.is_member(tenant_id));

drop policy if exists audit_events_select on public.audit_events;
create policy audit_events_select on public.audit_events for select to authenticated
  using (public.has_role(tenant_id, array['owner', 'admin']));

-- Tulis hanya lewat RPC (SECURITY DEFINER): API tidak diberi hak tulis langsung.
revoke all on public.tenants, public.memberships, public.locations,
  public.tenant_settings, public.audit_events from anon, authenticated;
grant select on public.tenants, public.memberships, public.locations,
  public.tenant_settings, public.audit_events to authenticated;

-- ---------- RPC ----------
create or replace function public.create_tenant(p_name text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_tenant uuid;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'INVALID_NAME';
  end if;

  insert into public.tenants (name, created_by) values (v_name, v_uid) returning id into v_tenant;
  insert into public.memberships (tenant_id, user_id, role, status) values (v_tenant, v_uid, 'owner', 'active');
  insert into public.locations (tenant_id, name, is_default) values (v_tenant, 'Toko Utama', true);
  insert into public.tenant_settings (tenant_id) values (v_tenant);
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (v_tenant, v_uid, 'tenant.create', 'tenant', v_tenant, jsonb_build_object('name', v_name));

  return v_tenant;
end $$;

revoke execute on function public.create_tenant(text) from public, anon;
grant execute on function public.create_tenant(text) to authenticated;
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
revoke execute on function public.has_role(uuid, text[]) from public, anon;
grant execute on function public.has_role(uuid, text[]) to authenticated;
