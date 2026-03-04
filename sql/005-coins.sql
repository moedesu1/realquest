-- ============================================================
-- 005: coin_transactions + coin_shop — コインシステム
-- ============================================================

-- コイン取引履歴（台帳）
create table public.coin_transactions (
  id          serial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      int not null,           -- 正=獲得, 負=消費
  type        text not null check (type in (
    'quest_clear',    -- クエストクリア報酬
    'review',         -- レビュー投稿報酬
    'referral',       -- 友達紹介報酬
    'campaign',       -- キャンペーン報酬
    'exchange',       -- ショップ交換（消費）
    'admin'           -- 運営調整
  )),
  description text not null default '',
  ref_id      text,                   -- 参照ID（order_id, review_id 等）
  created_at  timestamptz not null default now()
);

comment on table public.coin_transactions is 'コイン取引履歴';

create index idx_coin_tx_user on public.coin_transactions (user_id);
create index idx_coin_tx_type on public.coin_transactions (type);
create index idx_coin_tx_date on public.coin_transactions (created_at desc);

-- コインショップ商品
create table public.coin_items (
  id          serial primary key,
  name        text not null,
  description text not null default '',
  cost        int not null,
  icon        text not null default '💎',
  is_active   boolean not null default true,
  stock       int,                    -- null=無制限
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.coin_items is 'コイン交換所アイテム';

-- 交換履歴
create table public.coin_exchanges (
  id          serial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item_id     int not null references public.coin_items(id) on delete restrict,
  cost        int not null,
  created_at  timestamptz not null default now()
);

comment on table public.coin_exchanges is 'コイン交換履歴';

create index idx_coin_exchanges_user on public.coin_exchanges (user_id);

-- RLS
alter table public.coin_transactions enable row level security;
alter table public.coin_items enable row level security;
alter table public.coin_exchanges enable row level security;

create policy "本人の取引履歴のみ閲覧可"
  on public.coin_transactions for select using (auth.uid() = user_id);

create policy "ショップ商品は誰でも閲覧可"
  on public.coin_items for select using (is_active = true);

create policy "本人の交換履歴のみ閲覧可"
  on public.coin_exchanges for select using (auth.uid() = user_id);

create policy "本人のみ交換可"
  on public.coin_exchanges for insert with check (auth.uid() = user_id);

-- 交換時にコインを差し引くトリガー
create or replace function public.handle_coin_exchange()
returns trigger as $$
declare
  item_cost int;
  user_coins int;
begin
  select cost into item_cost from public.coin_items where id = new.item_id;
  select coins into user_coins from public.profiles where id = new.user_id;

  if user_coins < item_cost then
    raise exception 'コインが不足しています';
  end if;

  -- コインを減算
  update public.profiles set coins = coins - item_cost where id = new.user_id;

  -- 取引履歴を記録
  insert into public.coin_transactions (user_id, amount, type, description, ref_id)
  values (new.user_id, -item_cost, 'exchange',
    (select name from public.coin_items where id = new.item_id),
    new.id::text);

  -- 在庫があれば減算
  update public.coin_items
  set stock = stock - 1
  where id = new.item_id and stock is not null;

  new.cost := item_cost;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_coin_exchange
  before insert on public.coin_exchanges
  for each row execute function public.handle_coin_exchange();

-- ============================================================
-- 初期データ: ショップ商品
-- ============================================================
insert into public.coin_items (name, description, cost, icon, sort_order) values
  ('ヒント解放コード', '詰まったクエストのヒントを1段階解放', 50, '💡', 1),
  ('称号カスタムカラー', '称号バッジの色を好きな色に変更', 100, '🎨', 2),
  ('限定クエスト挑戦権', '招待制クエストへの参加チケット', 300, '🎫', 3),
  ('冒険者プロフィール枠', 'プロフィールの枠デザインを変更', 150, '🖼️', 4);
