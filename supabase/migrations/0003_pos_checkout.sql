-- 0003_pos_checkout: transaksi POS atomik, idempotensi, snapshot harga, dan pengurangan stok.

create table if not exists public.receipt_counters (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  business_date date not null,
  last_number integer not null default 0 check (last_number > 0),
  primary key (tenant_id, business_date)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  receipt_no text not null,
  customer_id uuid,
  subtotal bigint not null check (subtotal >= 0),
  discount_total bigint not null default 0 check (discount_total >= 0),
  total bigint not null check (total >= 0 and total = subtotal - discount_total),
  payment_method text not null check (payment_method in ('cash', 'transfer', 'qris')),
  amount_received bigint,
  change bigint not null default 0 check (change >= 0),
  status text not null default 'completed' check (status in ('completed', 'voided')),
  cashier_id uuid references auth.users (id) on delete set null,
  idempotency_key uuid not null,
  completed_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text,
  voided_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, receipt_no),
  unique (tenant_id, idempotency_key),
  check (
    (payment_method = 'cash' and amount_received is not null and amount_received >= total and change = amount_received - total)
    or (payment_method in ('transfer', 'qris') and amount_received is null and change = 0)
  )
);
create index if not exists sales_tenant_completed_idx
  on public.sales (tenant_id, completed_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  sku text not null,
  name text not null,
  unit text not null,
  track_stock boolean not null,
  price integer not null check (price >= 0),
  cost integer check (cost is null or cost >= 0),
  qty integer not null check (qty > 0),
  line_total bigint not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  unique (sale_id, product_id),
  check (line_total = price::bigint * qty::bigint)
);
create index if not exists sale_items_tenant_sale_idx on public.sale_items (tenant_id, sale_id);
create unique index if not exists stock_movements_sale_once_idx
  on public.stock_movements (tenant_id, source_id, product_id, type)
  where source_type = 'sale' and source_id is not null;

create or replace trigger sales_updated_at before update on public.sales
  for each row execute function public.set_updated_at();

alter table public.receipt_counters enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales for select to authenticated
  using (public.is_member(tenant_id));
drop policy if exists sale_items_select on public.sale_items;
create policy sale_items_select on public.sale_items for select to authenticated
  using (public.is_member(tenant_id));

revoke all on public.receipt_counters, public.sales, public.sale_items from anon, authenticated;

create or replace function public.pos_checkout(
  p_tenant_id uuid,
  p_items jsonb,
  p_discount bigint,
  p_payment_method text,
  p_amount_received bigint,
  p_customer_id uuid,
  p_idempotency_key uuid,
  p_expected_total bigint,
  p_accept_price_change boolean default false
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_location uuid;
  v_timezone text;
  v_prefix text;
  v_discount_limit integer;
  v_business_date date;
  v_counter integer;
  v_receipt text;
  v_sale uuid;
  v_existing public.sales%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_qty integer;
  v_balance integer;
  v_subtotal bigint := 0;
  v_discount bigint := coalesce(p_discount, 0);
  v_total bigint;
  v_change bigint := 0;
  v_item_count integer;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  select m.role into v_role
  from public.memberships m
  where m.tenant_id = p_tenant_id and m.user_id = v_uid and m.status = 'active';
  if v_role is null or v_role not in ('owner', 'admin', 'kasir') then raise exception 'FORBIDDEN'; end if;

  if p_idempotency_key is null then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  select * into v_existing from public.sales s
  where s.tenant_id = p_tenant_id and s.idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'sale_id', v_existing.id,
      'receipt_no', v_existing.receipt_no,
      'subtotal', v_existing.subtotal,
      'discount_total', v_existing.discount_total,
      'total', v_existing.total,
      'payment_method', v_existing.payment_method,
      'amount_received', v_existing.amount_received,
      'change', v_existing.change,
      'idempotent', true
    );
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'INVALID_CART'; end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 100 then raise exception 'INVALID_CART'; end if;
  if (
    select count(distinct item->>'product_id') <> count(*)
    from jsonb_array_elements(p_items) item
  ) then raise exception 'DUPLICATE_PRODUCT'; end if;
  if v_discount < 0 then raise exception 'INVALID_DISCOUNT'; end if;
  if p_payment_method is null or p_payment_method not in ('cash', 'transfer', 'qris') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  select l.id into v_location from public.locations l
  where l.tenant_id = p_tenant_id and l.is_default limit 1;
  if v_location is null then raise exception 'LOCATION_NOT_FOUND'; end if;

  select s.timezone, s.receipt_prefix, s.kasir_discount_limit
    into v_timezone, v_prefix, v_discount_limit
  from public.tenant_settings s where s.tenant_id = p_tenant_id;
  if v_timezone is null then raise exception 'TENANT_SETTINGS_NOT_FOUND'; end if;

  -- Urutan product_id konsisten untuk mencegah deadlock saat dua kasir checkout bersamaan.
  for v_item in
    select item from jsonb_array_elements(p_items) item
    order by item->>'product_id'
  loop
    if coalesce(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(v_item->>'qty', '') !~ '^[1-9][0-9]*$' then
      raise exception 'INVALID_CART';
    end if;
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    if v_qty > 100000 then raise exception 'INVALID_CART'; end if;

    select * into v_product from public.products p
    where p.id = v_product_id and p.tenant_id = p_tenant_id and p.is_active
    for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;

    if v_product.track_stock then
      select b.balance into v_balance from public.stock_balances b
      where b.tenant_id = p_tenant_id and b.product_id = v_product_id and b.location_id = v_location
      for update;
      if v_balance is null or v_balance < v_qty then raise exception 'INSUFFICIENT_STOCK'; end if;
    end if;

    v_subtotal := v_subtotal + (v_product.price::bigint * v_qty::bigint);
  end loop;

  if v_discount > v_subtotal then raise exception 'INVALID_DISCOUNT'; end if;
  if v_role = 'kasir' and v_discount > v_discount_limit then raise exception 'DISCOUNT_LIMIT_EXCEEDED'; end if;
  v_total := v_subtotal - v_discount;

  if p_expected_total is null or p_expected_total < 0 then raise exception 'INVALID_TOTAL'; end if;
  if p_expected_total <> v_total and not coalesce(p_accept_price_change, false) then
    raise exception 'PRICE_CHANGED';
  end if;

  if p_payment_method = 'cash' then
    if p_amount_received is null or p_amount_received < v_total then raise exception 'INSUFFICIENT_PAYMENT'; end if;
    v_change := p_amount_received - v_total;
  elsif p_amount_received is not null then
    raise exception 'INVALID_PAYMENT_AMOUNT';
  end if;

  v_business_date := (now() at time zone v_timezone)::date;
  insert into public.receipt_counters (tenant_id, business_date, last_number)
    values (p_tenant_id, v_business_date, 1)
  on conflict (tenant_id, business_date) do update
    set last_number = receipt_counters.last_number + 1
  returning last_number into v_counter;
  v_receipt := v_prefix || '-' || to_char(v_business_date, 'YYYYMMDD') || '-' || lpad(v_counter::text, 4, '0');

  insert into public.sales (
    tenant_id, receipt_no, customer_id, subtotal, discount_total, total,
    payment_method, amount_received, change, cashier_id, idempotency_key
  ) values (
    p_tenant_id, v_receipt, p_customer_id, v_subtotal, v_discount, v_total,
    p_payment_method, case when p_payment_method = 'cash' then p_amount_received else null end,
    v_change, v_uid, p_idempotency_key
  ) returning id into v_sale;

  for v_item in select item from jsonb_array_elements(p_items) item loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    select * into v_product from public.products p
    where p.id = v_product_id and p.tenant_id = p_tenant_id;

    insert into public.sale_items (
      tenant_id, sale_id, product_id, sku, name, unit, track_stock, price, cost, qty, line_total
    ) values (
      p_tenant_id, v_sale, v_product.id, v_product.sku, v_product.name, v_product.unit,
      v_product.track_stock, v_product.price, v_product.cost, v_qty,
      v_product.price::bigint * v_qty::bigint
    );

    if v_product.track_stock then
      update public.stock_balances set balance = balance - v_qty
      where tenant_id = p_tenant_id and product_id = v_product.id and location_id = v_location;
      insert into public.stock_movements (
        tenant_id, product_id, location_id, type, qty_signed, source_type, source_id, reason, actor_id
      ) values (
        p_tenant_id, v_product.id, v_location, 'sale', -v_qty, 'sale', v_sale, v_receipt, v_uid
      );
    end if;
  end loop;

  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'sale.complete', 'sale', v_sale,
      jsonb_build_object('receipt_no', v_receipt, 'total', v_total, 'payment_method', p_payment_method));

  return jsonb_build_object(
    'sale_id', v_sale,
    'receipt_no', v_receipt,
    'subtotal', v_subtotal,
    'discount_total', v_discount,
    'total', v_total,
    'payment_method', p_payment_method,
    'amount_received', case when p_payment_method = 'cash' then p_amount_received else null end,
    'change', v_change,
    'idempotent', false
  );
exception when unique_violation then
  -- Menangani dua request dengan key sama yang tiba bersamaan.
  select * into v_existing from public.sales s
  where s.tenant_id = p_tenant_id and s.idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'sale_id', v_existing.id,
      'receipt_no', v_existing.receipt_no,
      'subtotal', v_existing.subtotal,
      'discount_total', v_existing.discount_total,
      'total', v_existing.total,
      'payment_method', v_existing.payment_method,
      'amount_received', v_existing.amount_received,
      'change', v_existing.change,
      'idempotent', true
    );
  end if;
  raise;
end $$;

create or replace function public.pos_get_sale(p_tenant_id uuid, p_sale_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_items jsonb;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin', 'kasir']) then raise exception 'FORBIDDEN'; end if;

  select * into v_sale from public.sales s
  where s.id = p_sale_id and s.tenant_id = p_tenant_id;
  if not found then raise exception 'SALE_NOT_FOUND'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', i.product_id,
    'sku', i.sku,
    'name', i.name,
    'unit', i.unit,
    'price', i.price,
    'qty', i.qty,
    'line_total', i.line_total
  ) order by i.created_at, i.id), '[]'::jsonb) into v_items
  from public.sale_items i where i.sale_id = v_sale.id and i.tenant_id = p_tenant_id;

  return jsonb_build_object(
    'id', v_sale.id,
    'receipt_no', v_sale.receipt_no,
    'subtotal', v_sale.subtotal,
    'discount_total', v_sale.discount_total,
    'total', v_sale.total,
    'payment_method', v_sale.payment_method,
    'amount_received', v_sale.amount_received,
    'change', v_sale.change,
    'status', v_sale.status,
    'completed_at', v_sale.completed_at,
    'items', v_items
  );
end $$;

create or replace function public.update_cashier_discount_limit(p_tenant_id uuid, p_limit integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner']) then raise exception 'FORBIDDEN'; end if;
  if p_limit is null or p_limit < 0 or p_limit > 1000000000 then raise exception 'INVALID_DISCOUNT'; end if;

  update public.tenant_settings set kasir_discount_limit = p_limit where tenant_id = p_tenant_id;
  if not found then raise exception 'TENANT_SETTINGS_NOT_FOUND'; end if;
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'settings.cashier_discount_limit', 'tenant', p_tenant_id,
      jsonb_build_object('kasir_discount_limit', p_limit));
  return p_limit;
end $$;

revoke execute on function public.pos_checkout(uuid, jsonb, bigint, text, bigint, uuid, uuid, bigint, boolean) from public, anon;
revoke execute on function public.pos_get_sale(uuid, uuid) from public, anon;
revoke execute on function public.update_cashier_discount_limit(uuid, integer) from public, anon;
grant execute on function public.pos_checkout(uuid, jsonb, bigint, text, bigint, uuid, uuid, bigint, boolean) to authenticated;
grant execute on function public.pos_get_sale(uuid, uuid) to authenticated;
grant execute on function public.update_cashier_discount_limit(uuid, integer) to authenticated;

