-- 0005_mvp_completion: tim, edit katalog, rekonsiliasi stok, laporan, dan audit MVP.

-- ---------- Tim & peran ----------
create or replace function public.team_list_members(p_tenant_id uuid)
returns table (
  id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner']) then raise exception 'FORBIDDEN'; end if;
  return query
  select m.id, m.user_id, u.email::text, m.role, m.status, m.created_at
  from public.memberships m
  join auth.users u on u.id = m.user_id
  where m.tenant_id = p_tenant_id
  order by case m.role when 'owner' then 0 when 'admin' then 1 when 'kasir' then 2 else 3 end, u.email;
end $$;

create or replace function public.team_add_member(p_tenant_id uuid, p_user_id uuid, p_role text)
returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_membership uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner']) then raise exception 'FORBIDDEN'; end if;
  if p_role is null or p_role not in ('admin', 'kasir', 'staf_stok') then raise exception 'INVALID_ROLE'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id) then raise exception 'USER_NOT_FOUND'; end if;
  if exists (select 1 from public.memberships m where m.tenant_id = p_tenant_id and m.user_id = p_user_id) then
    raise exception 'MEMBER_EXISTS';
  end if;

  insert into public.memberships (tenant_id, user_id, role, status)
    values (p_tenant_id, p_user_id, p_role, 'active') returning id into v_membership;
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'member.add', 'membership', v_membership,
      jsonb_build_object('user_id', p_user_id, 'role', p_role, 'status', 'active'));
  return v_membership;
end $$;

create or replace function public.team_update_member(
  p_tenant_id uuid,
  p_membership_id uuid,
  p_role text,
  p_status text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.memberships%rowtype;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner']) then raise exception 'FORBIDDEN'; end if;
  if p_role is null or p_role not in ('admin', 'kasir', 'staf_stok') then raise exception 'INVALID_ROLE'; end if;
  if p_status is null or p_status not in ('active', 'inactive') then raise exception 'INVALID_STATUS'; end if;

  select * into v_old from public.memberships m
    where m.id = p_membership_id and m.tenant_id = p_tenant_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if v_old.role = 'owner' or v_old.user_id = v_uid then raise exception 'OWNER_MEMBERSHIP_PROTECTED'; end if;

  update public.memberships set role = p_role, status = p_status where id = v_old.id;
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'member.update', 'membership', v_old.id,
      jsonb_build_object(
        'user_id', v_old.user_id,
        'old_role', v_old.role,
        'new_role', p_role,
        'old_status', v_old.status,
        'new_status', p_status
      ));
  return v_old.id;
end $$;

-- ---------- Edit katalog ----------
create or replace function public.catalog_update_product(
  p_tenant_id uuid,
  p_product_id uuid,
  p_sku text,
  p_name text,
  p_category text,
  p_unit text,
  p_price integer,
  p_cost integer,
  p_min_stock integer
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.products%rowtype;
  v_sku text := upper(btrim(coalesce(p_sku, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_unit text := lower(btrim(coalesce(p_unit, '')));
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin']) then raise exception 'FORBIDDEN'; end if;
  select * into v_old from public.products p
    where p.tenant_id = p_tenant_id and p.id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if v_sku !~ '^[A-Z0-9._/-]{1,40}$' then raise exception 'INVALID_SKU'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120
    or char_length(v_unit) < 1 or char_length(v_unit) > 20
    or p_price is null or p_price < 0
    or (p_cost is not null and p_cost < 0)
    or coalesce(p_min_stock, 0) < 0 then raise exception 'INVALID_PRODUCT';
  end if;

  begin
    update public.products set
      sku = v_sku,
      name = v_name,
      category = nullif(btrim(coalesce(p_category, '')), ''),
      unit = v_unit,
      price = p_price,
      cost = p_cost,
      min_stock = case when track_stock then coalesce(p_min_stock, 0) else 0 end
    where id = v_old.id;
  exception when unique_violation then
    raise exception 'DUPLICATE_SKU';
  end;

  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'product.update', 'product', v_old.id,
      jsonb_build_object(
        'old_sku', v_old.sku, 'new_sku', v_sku,
        'old_price', v_old.price, 'new_price', p_price,
        'old_cost', v_old.cost, 'new_cost', p_cost
      ));
  return v_old.id;
end $$;

create or replace function public.catalog_set_product_active(
  p_tenant_id uuid,
  p_product_id uuid,
  p_is_active boolean
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.products%rowtype;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin']) then raise exception 'FORBIDDEN'; end if;
  select * into v_old from public.products p
    where p.tenant_id = p_tenant_id and p.id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if p_is_active is null then raise exception 'INVALID_PRODUCT'; end if;
  update public.products set is_active = p_is_active where id = v_old.id;
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, details)
    values (p_tenant_id, v_uid, 'product.status', 'product', v_old.id,
      jsonb_build_object('old_active', v_old.is_active, 'new_active', p_is_active));
  return v_old.id;
exception when unique_violation then
  raise exception 'DUPLICATE_SKU';
end $$;

-- ---------- Riwayat & rekonsiliasi stok ----------
create or replace function public.inventory_list_movements(p_tenant_id uuid, p_limit integer default 100)
returns table (
  id uuid,
  product_id uuid,
  product_name text,
  product_sku text,
  type text,
  qty_signed integer,
  source_type text,
  reason text,
  actor_email text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_member(p_tenant_id) then raise exception 'FORBIDDEN'; end if;
  return query
  select m.id, m.product_id, p.name, p.sku, m.type, m.qty_signed, m.source_type, m.reason,
    u.email::text, m.created_at
  from public.stock_movements m
  join public.products p on p.id = m.product_id and p.tenant_id = m.tenant_id
  left join auth.users u on u.id = m.actor_id
  where m.tenant_id = p_tenant_id
  order by m.created_at desc, m.id desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

create or replace function public.inventory_reconcile(p_tenant_id uuid)
returns table (
  product_id uuid,
  product_name text,
  balance integer,
  ledger_balance integer,
  difference integer
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner']) then raise exception 'FORBIDDEN'; end if;
  return query
  select p.id, p.name, coalesce(b.balance, 0)::integer,
    coalesce(sum(m.qty_signed), 0)::integer,
    (coalesce(b.balance, 0) - coalesce(sum(m.qty_signed), 0))::integer
  from public.products p
  left join public.stock_balances b on b.tenant_id = p.tenant_id and b.product_id = p.id
  left join public.stock_movements m
    on m.tenant_id = p.tenant_id and m.product_id = p.id and (b.location_id is null or m.location_id = b.location_id)
  where p.tenant_id = p_tenant_id and p.track_stock
  group by p.id, p.name, b.balance
  order by p.name;
end $$;

-- ---------- Beranda & laporan ----------
create or replace function public.report_dashboard(p_tenant_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_timezone text;
  v_today date;
  v_today_start timestamptz;
  v_tomorrow_start timestamptz;
  v_week_start timestamptz;
  v_today_revenue bigint;
  v_today_count integer;
  v_week_revenue bigint;
  v_week_count integer;
  v_top jsonb;
  v_low jsonb;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select m.role into v_role from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = v_uid and m.status = 'active';
  if v_role is null or v_role not in ('owner', 'admin', 'kasir') then raise exception 'FORBIDDEN'; end if;
  select s.timezone into v_timezone from public.tenant_settings s where s.tenant_id = p_tenant_id;
  if v_timezone is null then raise exception 'TENANT_SETTINGS_NOT_FOUND'; end if;
  v_today := (now() at time zone v_timezone)::date;
  v_today_start := v_today::timestamp at time zone v_timezone;
  v_tomorrow_start := (v_today + 1)::timestamp at time zone v_timezone;
  v_week_start := (v_today - 6)::timestamp at time zone v_timezone;

  select coalesce(sum(s.total), 0), count(*)::integer into v_today_revenue, v_today_count
  from public.sales s
  where s.tenant_id = p_tenant_id and s.status = 'completed'
    and s.completed_at >= v_today_start and s.completed_at < v_tomorrow_start
    and (v_role <> 'kasir' or s.cashier_id = v_uid);
  select coalesce(sum(s.total), 0), count(*)::integer into v_week_revenue, v_week_count
  from public.sales s
  where s.tenant_id = p_tenant_id and s.status = 'completed'
    and s.completed_at >= v_week_start and s.completed_at < v_tomorrow_start
    and (v_role <> 'kasir' or s.cashier_id = v_uid);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_top from (
    select i.product_id, i.name, sum(i.qty)::integer as qty, sum(i.line_total)::bigint as amount
    from public.sale_items i
    join public.sales s on s.id = i.sale_id and s.tenant_id = i.tenant_id
    where s.tenant_id = p_tenant_id and s.status = 'completed'
      and s.completed_at >= v_week_start and s.completed_at < v_tomorrow_start
      and (v_role <> 'kasir' or s.cashier_id = v_uid)
    group by i.product_id, i.name
    order by sum(i.qty) desc, sum(i.line_total) desc
    limit 5
  ) t;
  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) into v_low from (
    select p.id as product_id, p.name, p.sku, coalesce(sum(b.balance), 0)::integer as balance,
      p.min_stock, p.unit
    from public.products p
    left join public.stock_balances b on b.tenant_id = p.tenant_id and b.product_id = p.id
    where p.tenant_id = p_tenant_id and p.is_active and p.track_stock
    group by p.id
    having coalesce(sum(b.balance), 0) <= p.min_stock
    order by coalesce(sum(b.balance), 0), p.name
    limit 10
  ) l;

  return jsonb_build_object(
    'role', v_role,
    'today_revenue', v_today_revenue,
    'today_count', v_today_count,
    'week_revenue', v_week_revenue,
    'week_count', v_week_count,
    'top_products', v_top,
    'low_stock', v_low,
    'generated_at', now()
  );
end $$;

create or replace function public.report_sales(p_tenant_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_timezone text;
  v_from date;
  v_to date;
  v_start timestamptz;
  v_end timestamptz;
  v_revenue bigint;
  v_count integer;
  v_cost bigint;
  v_missing_cost boolean;
  v_daily jsonb;
  v_top jsonb;
  v_stock jsonb;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner', 'admin']) then raise exception 'FORBIDDEN'; end if;
  select s.timezone into v_timezone from public.tenant_settings s where s.tenant_id = p_tenant_id;
  if v_timezone is null then raise exception 'TENANT_SETTINGS_NOT_FOUND'; end if;
  v_to := coalesce(p_to, (now() at time zone v_timezone)::date);
  v_from := coalesce(p_from, v_to - 6);
  if v_from > v_to or v_to - v_from > 366 then raise exception 'INVALID_DATE_RANGE'; end if;
  v_start := v_from::timestamp at time zone v_timezone;
  v_end := (v_to + 1)::timestamp at time zone v_timezone;

  select coalesce(sum(s.total), 0), count(*)::integer into v_revenue, v_count
  from public.sales s where s.tenant_id = p_tenant_id and s.status = 'completed'
    and s.completed_at >= v_start and s.completed_at < v_end;
  select coalesce(sum(coalesce(i.cost, 0)::bigint * i.qty::bigint), 0), coalesce(bool_or(i.cost is null), false)
    into v_cost, v_missing_cost
  from public.sale_items i join public.sales s on s.id = i.sale_id and s.tenant_id = i.tenant_id
  where s.tenant_id = p_tenant_id and s.status = 'completed'
    and s.completed_at >= v_start and s.completed_at < v_end;
  select coalesce(jsonb_agg(to_jsonb(d) order by d.day), '[]'::jsonb) into v_daily from (
    select (s.completed_at at time zone v_timezone)::date as day,
      count(*)::integer as transaction_count, sum(s.total)::bigint as revenue
    from public.sales s where s.tenant_id = p_tenant_id and s.status = 'completed'
      and s.completed_at >= v_start and s.completed_at < v_end
    group by 1
  ) d;
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_top from (
    select i.product_id, i.name, sum(i.qty)::integer as qty, sum(i.line_total)::bigint as amount
    from public.sale_items i join public.sales s on s.id = i.sale_id and s.tenant_id = i.tenant_id
    where s.tenant_id = p_tenant_id and s.status = 'completed'
      and s.completed_at >= v_start and s.completed_at < v_end
    group by i.product_id, i.name order by sum(i.qty) desc, sum(i.line_total) desc limit 10
  ) t;
  select coalesce(jsonb_agg(to_jsonb(st)), '[]'::jsonb) into v_stock from (
    select p.id as product_id, p.name, p.sku, coalesce(sum(b.balance), 0)::integer as balance,
      p.min_stock, p.unit
    from public.products p left join public.stock_balances b
      on b.tenant_id = p.tenant_id and b.product_id = p.id
    where p.tenant_id = p_tenant_id and p.is_active and p.track_stock
    group by p.id order by p.name
  ) st;

  return jsonb_build_object(
    'from', v_from,
    'to', v_to,
    'revenue', v_revenue,
    'transaction_count', v_count,
    'gross_profit_estimate', v_revenue - v_cost,
    'missing_cost', v_missing_cost,
    'daily', v_daily,
    'top_products', v_top,
    'stock', v_stock
  );
end $$;

create or replace function public.audit_list(p_tenant_id uuid, p_limit integer default 100)
returns table (
  id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  actor_email text,
  details jsonb,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.has_role(p_tenant_id, array['owner']) then raise exception 'FORBIDDEN'; end if;
  return query
  select a.id, a.action, a.entity_type, a.entity_id, u.email::text, a.details, a.created_at
  from public.audit_events a left join auth.users u on u.id = a.actor_id
  where a.tenant_id = p_tenant_id
  order by a.created_at desc, a.id desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

revoke execute on function public.team_list_members(uuid) from public, anon;
revoke execute on function public.team_add_member(uuid, uuid, text) from public, anon;
revoke execute on function public.team_update_member(uuid, uuid, text, text) from public, anon;
revoke execute on function public.catalog_update_product(uuid, uuid, text, text, text, text, integer, integer, integer) from public, anon;
revoke execute on function public.catalog_set_product_active(uuid, uuid, boolean) from public, anon;
revoke execute on function public.inventory_list_movements(uuid, integer) from public, anon;
revoke execute on function public.inventory_reconcile(uuid) from public, anon;
revoke execute on function public.report_dashboard(uuid) from public, anon;
revoke execute on function public.report_sales(uuid, date, date) from public, anon;
revoke execute on function public.audit_list(uuid, integer) from public, anon;
grant execute on function public.team_list_members(uuid) to authenticated;
grant execute on function public.team_add_member(uuid, uuid, text) to authenticated;
grant execute on function public.team_update_member(uuid, uuid, text, text) to authenticated;
grant execute on function public.catalog_update_product(uuid, uuid, text, text, text, text, integer, integer, integer) to authenticated;
grant execute on function public.catalog_set_product_active(uuid, uuid, boolean) to authenticated;
grant execute on function public.inventory_list_movements(uuid, integer) to authenticated;
grant execute on function public.inventory_reconcile(uuid) to authenticated;
grant execute on function public.report_dashboard(uuid) to authenticated;
grant execute on function public.report_sales(uuid, date, date) to authenticated;
grant execute on function public.audit_list(uuid, integer) to authenticated;

