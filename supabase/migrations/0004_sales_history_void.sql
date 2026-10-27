-- 0004_sales_history_void: riwayat transaksi, pengajuan batal, dan void idempoten.

create table if not exists public.void_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sale_id uuid not null references public.sales (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  reason text not null check (char_length(btrim(reason)) >= 3),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists void_requests_one_pending_idx
  on public.void_requests (tenant_id, sale_id) where status = 'pending';
create index if not exists void_requests_tenant_created_idx
  on public.void_requests (tenant_id, created_at desc);
create unique index if not exists stock_movements_void_once_idx
  on public.stock_movements (tenant_id, source_id, product_id, type)
  where source_type = 'sale_void' and source_id is not null;

create or replace trigger void_requests_updated_at before update on public.void_requests
  for each row execute function public.set_updated_at();

alter table public.void_requests enable row level security;
drop policy if exists void_requests_select on public.void_requests;
create policy void_requests_select on public.void_requests for select to authenticated
  using (public.is_member(tenant_id));
revoke all on public.void_requests from anon, authenticated;

create or replace function public.pos_list_sales(
  p_tenant_id uuid,
  p_query text default null,
  p_from date default null,
  p_to date default null
) returns table (
  id uuid,
  receipt_no text,
  total bigint,
  payment_method text,
  status text,
  completed_at timestamptz,
  cashier_id uuid,
  item_count integer,
  void_request_status text
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_timezone text;
  v_from date;
  v_to date;
  v_query text := btrim(coalesce(p_query, ''));
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select m.role into v_role from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = v_uid and m.status = 'active';
  if v_role is null or v_role not in ('owner', 'admin', 'kasir') then raise exception 'FORBIDDEN'; end if;
  select s.timezone into v_timezone from public.tenant_settings s where s.tenant_id = p_tenant_id;
  if v_timezone is null then raise exception 'TENANT_SETTINGS_NOT_FOUND'; end if;

  v_to := coalesce(p_to, (now() at time zone v_timezone)::date);
  v_from := coalesce(p_from, v_to - 30);
  if v_from > v_to or v_to - v_from > 366 then raise exception 'INVALID_DATE_RANGE'; end if;

  return query
  select s.id, s.receipt_no, s.total, s.payment_method, s.status, s.completed_at, s.cashier_id,
    count(i.id)::integer,
    (select vr.status from public.void_requests vr
      where vr.tenant_id = p_tenant_id and vr.sale_id = s.id
      order by vr.created_at desc limit 1)
  from public.sales s
  join public.sale_items i on i.tenant_id = s.tenant_id and i.sale_id = s.id
  where s.tenant_id = p_tenant_id
    and (v_role <> 'kasir' or s.cashier_id = v_uid)
    and (v_query = '' or s.receipt_no ilike '%' || v_query || '%')
    and s.completed_at >= (v_from::timestamp at time zone v_timezone)
    and s.completed_at < ((v_to + 1)::timestamp at time zone v_timezone)
  group by s.id
  order by s.completed_at desc;
end $$;

create or replace function public.pos_request_void(
  p_tenant_id uuid,
  p_sale_id uuid,
  p_reason text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_sale public.sales%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_request uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select m.role into v_role from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = v_uid and m.status = 'active';
  if v_role is null or v_role not in ('owner', 'admin', 'kasir') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_reason) < 3 then raise exception 'REASON_REQUIRED'; end if;

  select * into v_sale from public.sales s
    where s.tenant_id = p_tenant_id and s.id = p_sale_id for update;
  if not found then raise exception 'SALE_NOT_FOUND'; end if;
  if v_role = 'kasir' and v_sale.cashier_id <> v_uid then raise exception 'FORBIDDEN'; end if;
  if v_sale.status = 'voided' then raise exception 'SALE_ALREADY_VOIDED'; end if;

  select r.id into v_request from public.void_requests r
    where r.tenant_id = p_tenant_id and r.sale_id = p_sale_id and r.status = 'pending';
  if found then return v_request; end if;

  insert into public.void_requests (tenant_id, sale_id, requested_by, reason)
    values (p_tenant_id, p_sale_id, v_uid, v_reason) returning id into v_request;
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'sale.void_requested', 'sale', p_sale_id,
      jsonb_build_object('request_id', v_request, 'reason', v_reason));
  return v_request;
end $$;

create or replace function public.pos_void(
  p_tenant_id uuid,
  p_sale_id uuid,
  p_reason text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sale public.sales%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_location uuid;
  v_item public.sale_items%rowtype;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin']) then raise exception 'FORBIDDEN'; end if;
  if char_length(v_reason) < 3 then raise exception 'REASON_REQUIRED'; end if;

  select * into v_sale from public.sales s
    where s.tenant_id = p_tenant_id and s.id = p_sale_id for update;
  if not found then raise exception 'SALE_NOT_FOUND'; end if;
  if v_sale.status = 'voided' then return v_sale.id; end if;

  select l.id into v_location from public.locations l
    where l.tenant_id = p_tenant_id and l.is_default limit 1;
  if v_location is null then raise exception 'LOCATION_NOT_FOUND'; end if;

  for v_item in
    select i.* from public.sale_items i
    where i.tenant_id = p_tenant_id and i.sale_id = p_sale_id and i.track_stock
    order by i.product_id
  loop
    perform 1 from public.stock_balances b
      where b.tenant_id = p_tenant_id and b.product_id = v_item.product_id and b.location_id = v_location
      for update;
    if not found then raise exception 'STOCK_BALANCE_NOT_FOUND'; end if;
    update public.stock_balances set balance = balance + v_item.qty
      where tenant_id = p_tenant_id and product_id = v_item.product_id and location_id = v_location;
    insert into public.stock_movements (
      tenant_id, product_id, location_id, type, qty_signed, source_type, source_id, reason, actor_id
    ) values (
      p_tenant_id, v_item.product_id, v_location, 'void', v_item.qty,
      'sale_void', v_sale.id, v_reason, v_uid
    );
  end loop;

  update public.sales set status = 'voided', voided_at = now(), void_reason = v_reason, voided_by = v_uid
    where id = v_sale.id and tenant_id = p_tenant_id;
  update public.void_requests set status = 'approved', reviewed_by = v_uid, reviewed_at = now()
    where tenant_id = p_tenant_id and sale_id = v_sale.id and status = 'pending';
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'sale.void', 'sale', v_sale.id,
      jsonb_build_object('receipt_no', v_sale.receipt_no, 'reason', v_reason));
  return v_sale.id;
end $$;

-- Detail struk diperketat: kasir hanya dapat membuka transaksinya sendiri.
create or replace function public.pos_get_sale(p_tenant_id uuid, p_sale_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_sale public.sales%rowtype;
  v_items jsonb;
  v_request_status text;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select m.role into v_role from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = v_uid and m.status = 'active';
  if v_role is null or v_role not in ('owner', 'admin', 'kasir') then raise exception 'FORBIDDEN'; end if;

  select * into v_sale from public.sales s
    where s.id = p_sale_id and s.tenant_id = p_tenant_id;
  if not found then raise exception 'SALE_NOT_FOUND'; end if;
  if v_role = 'kasir' and v_sale.cashier_id <> v_uid then raise exception 'FORBIDDEN'; end if;

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
  select r.status into v_request_status from public.void_requests r
    where r.tenant_id = p_tenant_id and r.sale_id = v_sale.id
    order by r.created_at desc limit 1;

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
    'voided_at', v_sale.voided_at,
    'void_reason', v_sale.void_reason,
    'void_request_status', v_request_status,
    'items', v_items
  );
end $$;

revoke execute on function public.pos_list_sales(uuid, text, date, date) from public, anon;
revoke execute on function public.pos_request_void(uuid, uuid, text) from public, anon;
revoke execute on function public.pos_void(uuid, uuid, text) from public, anon;
grant execute on function public.pos_list_sales(uuid, text, date, date) to authenticated;
grant execute on function public.pos_request_void(uuid, uuid, text) to authenticated;
grant execute on function public.pos_void(uuid, uuid, text) to authenticated;

