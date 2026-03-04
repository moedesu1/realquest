-- ============================================================
-- 004: reviews + review_likes — レビューシステム
-- ============================================================

create table public.reviews (
  id          serial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  quest_id    int not null references public.quests(id) on delete cascade,
  stars       int not null check (stars between 1 and 5),
  text        text not null default '',
  craft_rating   int check (craft_rating between 1 and 5),
  story_rating   int check (story_rating between 1 and 5),
  volume_rating  int check (volume_rating between 1 and 5),
  likes_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, quest_id)  -- 1ユーザー1クエスト1レビュー
);

comment on table public.reviews is '冒険者レビュー';

create index idx_reviews_quest on public.reviews (quest_id);
create index idx_reviews_user on public.reviews (user_id);
create index idx_reviews_date on public.reviews (created_at desc);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.update_updated_at();

-- いいね
create table public.review_likes (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  review_id int not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

comment on table public.review_likes is 'レビューいいね';

-- レビュー投稿/削除時にクエストの review_avg / review_count を再計算
create or replace function public.recalc_quest_review_stats()
returns trigger as $$
declare
  target_quest_id int;
begin
  target_quest_id := coalesce(new.quest_id, old.quest_id);

  update public.quests set
    review_count = (select count(*) from public.reviews where quest_id = target_quest_id),
    review_avg   = coalesce((select round(avg(stars)::numeric, 1) from public.reviews where quest_id = target_quest_id), 0)
  where id = target_quest_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_quest_review_stats();

-- いいねカウント同期
create or replace function public.sync_review_likes_count()
returns trigger as $$
declare
  target_review_id int;
begin
  target_review_id := coalesce(new.review_id, old.review_id);
  update public.reviews
  set likes_count = (select count(*) from public.review_likes where review_id = target_review_id)
  where id = target_review_id;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_review_like_change
  after insert or delete on public.review_likes
  for each row execute function public.sync_review_likes_count();

-- レビュー投稿で 20コイン付与
create or replace function public.reward_review_coins()
returns trigger as $$
begin
  update public.profiles
  set coins = coins + 20
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created_coins
  after insert on public.reviews
  for each row execute function public.reward_review_coins();

-- RLS
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;

create policy "レビュー閲覧は誰でも可"
  on public.reviews for select using (true);

create policy "本人のみレビュー投稿可"
  on public.reviews for insert with check (auth.uid() = user_id);

create policy "本人のみレビュー更新可"
  on public.reviews for update using (auth.uid() = user_id);

create policy "本人のみレビュー削除可"
  on public.reviews for delete using (auth.uid() = user_id);

create policy "いいね閲覧は誰でも可"
  on public.review_likes for select using (true);

create policy "本人のみいいね可"
  on public.review_likes for insert with check (auth.uid() = user_id);

create policy "本人のみいいね取消可"
  on public.review_likes for delete using (auth.uid() = user_id);

-- ============================================================
-- 初期レビューデータ投入
-- ============================================================
-- ※ 本番ではユーザーが投稿するため不要。デモ用にダミーユーザーで投入する場合は
--   別途 auth.users に対応するレコードが必要。初期はクエストデータのみで運用し、
--   レビューは実ユーザーから集める方針を推奨。
