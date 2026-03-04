-- ============================================================
-- 001: profiles — ユーザープロフィール（auth.users 拡張）
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '名もなき冒険者',
  avatar      text not null default '冒',
  role        text not null default 'adventurer' check (role in ('adventurer', 'creator')),
  title       text not null default '見習い',
  level       int not null default 1,
  coins       int not null default 0,
  quests_accepted  int not null default 0,
  quests_completed int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'ユーザープロフィール（冒険者/創造者）';

-- 自動作成トリガー: auth.users 登録時に profile を生成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '名もなき冒険者'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 更新日時の自動更新
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "誰でもプロフィール閲覧可"
  on public.profiles for select using (true);

create policy "本人のみ更新可"
  on public.profiles for update using (auth.uid() = id);
