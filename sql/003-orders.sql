-- ============================================================
-- 003: orders — 注文管理
-- ============================================================

create table public.orders (
  id                serial primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  quest_id          int not null references public.quests(id) on delete restrict,
  status            text not null default 'pending'
                    check (status in ('pending','paid','preparing','shipped','delivered','completed','cancelled')),
  price             int not null,
  shopify_order_id  text,              -- Shopify 注文ID
  shopify_checkout_url text,           -- Shopify 決済URL
  shipping_name     text,
  shipping_zip      text,
  shipping_address  text,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.orders is '注文管理（Shopify連携）';

create index idx_orders_user on public.orders (user_id);
create index idx_orders_quest on public.orders (quest_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_shopify on public.orders (shopify_order_id) where shopify_order_id is not null;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

-- RLS
alter table public.orders enable row level security;

create policy "本人の注文のみ閲覧可"
  on public.orders for select using (auth.uid() = user_id);

create policy "本人の注文のみ作成可"
  on public.orders for insert with check (auth.uid() = user_id);

create policy "本人の注文のみ更新可"
  on public.orders for update using (auth.uid() = user_id);

-- ステータス更新時に profiles.quests_completed を加算するトリガー
create or replace function public.handle_order_completed()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.profiles
    set quests_completed = quests_completed + 1,
        coins = coins + 50  -- クリア報酬 50コイン
    where id = new.user_id;

    -- sales_count 更新
    update public.quests
    set sales_count = sales_count + 1
    where id = new.quest_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_completed
  after update on public.orders
  for each row execute function public.handle_order_completed();

-- 注文作成時に profiles.quests_accepted を加算
create or replace function public.handle_order_created()
returns trigger as $$
begin
  update public.profiles
  set quests_accepted = quests_accepted + 1
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_created
  after insert on public.orders
  for each row execute function public.handle_order_created();
