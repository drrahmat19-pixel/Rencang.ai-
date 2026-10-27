-- 0002_catalog_inventory: katalog produk + ledger stok + RPC aman per tenant.
-- Semua mutasi melalui SECURITY DEFINER; user aplikasi tidak menulis tabel langsung.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sku text not null,
  name text not null,
  category text,
  unit text not null default 'pcs',
  track_stock boolean not null default true,
  price integer not null check (price >= 0),
  cost integer check (cost is null or cost >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists products_active_sku_idx
  on public.products (tenant_id, upper(sku)) where is_active;
create index if not exists products_tenant_name_idx on public.products (tenant_id, name);

create table if not exists public.stock_balances (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, product_id, location_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  type text not null check (type in ('opening', 'in', 'adjustment', 'sale', 'void')),
  qty_signed integer not null check (qty_signed <> 0),
  source_type text,
  source_id uuid,
  reason text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_tenant_product_idx
  on public.stock_movements (tenant_id, product_id, created_at desc);

create or replace trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create or replace trigger stock_balances_updated_at before update on public.stock_balances
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.stock_balances enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated
  using (public.is_member(tenant_id));
drop policy if exists stock_balances_select on public.stock_balances;
create policy stock_balances_select on public.stock_balances for select to authenticated
  using (public.is_member(tenant_id));
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select on public.stock_movements for select to authenticated
  using (public.is_member(tenant_id));

-- Data katalog dibaca melalui RPC agar harga modal dapat disembunyikan berdasarkan peran.
revoke all on public.products, public.stock_balances, public.stock_movements from anon, authenticated;

create or replace function public.catalog_list_products(p_tenant_id uuid)
returns table (
  id uuid,
  sku text,
  name text,
  category text,
  unit text,
  track_stock boolean,
  price integer,
  cost integer,
  min_stock integer,
  is_active boolean,
  stock_balance integer
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_member(p_tenant_id) then raise exception 'FORBIDDEN'; end if;

  return query
  select p.id, p.sku, p.name, p.category, p.unit, p.track_stock, p.price,
    case when public.has_role(p_tenant_id, array['owner', 'admin']) then p.cost else null end,
    p.min_stock, p.is_active,
    case when p.track_stock then coalesce(sum(b.balance), 0)::integer else 0 end
  from public.products p
  left join public.stock_balances b
    on b.tenant_id = p.tenant_id and b.product_id = p.id
  where p.tenant_id = p_tenant_id
  group by p.id
  order by p.is_active desc, p.name asc;
end $$;

create or replace function public.catalog_create_product(
  p_tenant_id uuid,
  p_sku text,
  p_name text,
  p_category text,
  p_unit text,
  p_track_stock boolean,
  p_price integer,
  p_cost integer,
  p_min_stock integer,
  p_initial_stock integer
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_product uuid;
  v_location uuid;
  v_sku text := upper(btrim(coalesce(p_sku, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_unit text := lower(btrim(coalesce(p_unit, '')));
  v_track boolean := coalesce(p_track_stock, true);
  v_initial integer := coalesce(p_initial_stock, 0);
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin']) then raise exception 'FORBIDDEN'; end if;
  if v_sku !~ '^[A-Z0-9._/-]{1,40}$' then raise exception 'INVALID_SKU'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120
    or char_length(v_unit) < 1 or char_length(v_unit) > 20
    or p_price is null or p_price < 0
    or (p_cost is not null and p_cost < 0)
    or coalesce(p_min_stock, 0) < 0
    or v_initial < 0 then
    raise exception 'INVALID_PRODUCT';
  end if;

  if not v_track then v_initial := 0; end if;

  select l.id into v_location from public.locations l
  where l.tenant_id = p_tenant_id and l.is_default limit 1;
  if v_location is null then raise exception 'LOCATION_NOT_FOUND'; end if;

  begin
    insert into public.products (
      tenant_id, sku, name, category, unit, track_stock, price, cost, min_stock
    ) values (
      p_tenant_id, v_sku, v_name, nullif(btrim(coalesce(p_category, '')), ''), v_unit,
      v_track, p_price, p_cost, case when v_track then coalesce(p_min_stock, 0) else 0 end
    ) returning products.id into v_product;
  exception when unique_violation then
    raise exception 'DUPLICATE_SKU';
  end;

  if v_track then
    insert into public.stock_balances (tenant_id, product_id, location_id, balance)
      values (p_tenant_id, v_product, v_location, v_initial);
    if v_initial > 0 then
      insert into public.stock_movements (
        tenant_id, product_id, location_id, type, qty_signed, source_type, source_id, reason, actor_id
      ) values (
        p_tenant_id, v_product, v_location, 'opening', v_initial, 'product', v_product, 'Stok awal', v_uid
      );
    end if;
  end if;

  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'product.create', 'product', v_product,
      jsonb_build_object('sku', v_sku, 'name', v_name, 'price', p_price, 'cost', p_cost));
  return v_product;
end $$;

create or replace function public.inventory_stock_in(
  p_tenant_id uuid,
  p_product_id uuid,
  p_qty integer,
  p_note text
) returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_location uuid;
  v_balance integer;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin', 'staf_stok']) then
    raise exception 'FORBIDDEN';
  end if;
  if p_qty is null or p_qty <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  select l.id into v_location from public.locations l
  where l.tenant_id = p_tenant_id and l.is_default limit 1;
  if not exists (
    select 1 from public.products p where p.id = p_product_id and p.tenant_id = p_tenant_id
      and p.is_active and p.track_stock
  ) then raise exception 'PRODUCT_NOT_FOUND_OR_STOCK_NOT_TRACKED'; end if;

  insert into public.stock_balances (tenant_id, product_id, location_id, balance)
    values (p_tenant_id, p_product_id, v_location, 0)
    on conflict (tenant_id, product_id, location_id) do nothing;
  select b.balance into v_balance from public.stock_balances b
    where b.tenant_id = p_tenant_id and b.product_id = p_product_id and b.location_id = v_location
    for update;
  v_balance := v_balance + p_qty;
  update public.stock_balances set balance = v_balance
    where tenant_id = p_tenant_id and product_id = p_product_id and location_id = v_location;
  insert into public.stock_movements (
    tenant_id, product_id, location_id, type, qty_signed, source_type, reason, actor_id
  ) values (
    p_tenant_id, p_product_id, v_location, 'in', p_qty, 'manual',
    nullif(btrim(coalesce(p_note, '')), ''), v_uid
  );
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'inventory.stock_in', 'product', p_product_id,
      jsonb_build_object('qty', p_qty, 'balance', v_balance, 'note', p_note));
  return v_balance;
end $$;

create or replace function public.inventory_adjust(
  p_tenant_id uuid,
  p_product_id uuid,
  p_qty_signed integer,
  p_reason text
) returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_location uuid;
  v_balance integer;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin', 'staf_stok']) then
    raise exception 'FORBIDDEN';
  end if;
  if p_qty_signed is null or p_qty_signed = 0 then raise exception 'INVALID_AMOUNT'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'REASON_REQUIRED'; end if;
  if p_qty_signed > 0 and not public.has_role(p_tenant_id, array['owner', 'admin']) then
    raise exception 'POSITIVE_ADJUSTMENT_FORBIDDEN';
  end if;

  select l.id into v_location from public.locations l
  where l.tenant_id = p_tenant_id and l.is_default limit 1;
  if not exists (
    select 1 from public.products p where p.id = p_product_id and p.tenant_id = p_tenant_id
      and p.is_active and p.track_stock
  ) then raise exception 'PRODUCT_NOT_FOUND_OR_STOCK_NOT_TRACKED'; end if;

  select b.balance into v_balance from public.stock_balances b
    where b.tenant_id = p_tenant_id and b.product_id = p_product_id and b.location_id = v_location
    for update;
  v_balance := coalesce(v_balance, 0) + p_qty_signed;
  if v_balance < 0 then raise exception 'INSUFFICIENT_STOCK'; end if;
  update public.stock_balances set balance = v_balance
    where tenant_id = p_tenant_id and product_id = p_product_id and location_id = v_location;
  insert into public.stock_movements (
    tenant_id, product_id, location_id, type, qty_signed, source_type, reason, actor_id
  ) values (
    p_tenant_id, p_product_id, v_location, 'adjustment', p_qty_signed, 'manual', btrim(p_reason), v_uid
  );
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'inventory.adjust', 'product', p_product_id,
      jsonb_build_object('qty_signed', p_qty_signed, 'balance', v_balance, 'reason', btrim(p_reason)));
  return v_balance;
end $$;

revoke execute on function public.catalog_list_products(uuid) from public, anon;
revoke execute on function public.catalog_create_product(uuid, text, text, text, text, boolean, integer, integer, integer, integer) from public, anon;
revoke execute on function public.inventory_stock_in(uuid, uuid, integer, text) from public, anon;
revoke execute on function public.inventory_adjust(uuid, uuid, integer, text) from public, anon;
grant execute on function public.catalog_list_products(uuid) to authenticated;
grant execute on function public.catalog_create_product(uuid, text, text, text, text, boolean, integer, integer, integer, integer) to authenticated;
grant execute on function public.inventory_stock_in(uuid, uuid, integer, text) to authenticated;
grant execute on function public.inventory_adjust(uuid, uuid, integer, text) to authenticated;
