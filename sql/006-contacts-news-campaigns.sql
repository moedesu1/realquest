-- ============================================================
-- 006: contacts + news + campaigns — お問い合わせ・お知らせ・キャンペーン
-- ============================================================

-- お問い合わせ
create table public.contact_submissions (
  id          serial primary key,
  user_id     uuid references public.profiles(id) on delete set null,  -- ログイン中なら紐付け
  tab         text not null default 'general' check (tab in ('general', 'business')),
  name        text not null,
  email       text not null,
  company     text,
  phone       text,
  type        text not null,
  message     text not null,
  status      text not null default 'new' check (status in ('new','in_progress','resolved','closed')),
  note        text,                   -- 運営メモ
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.contact_submissions is 'お問い合わせ';

create index idx_contacts_status on public.contact_submissions (status);
create index idx_contacts_date on public.contact_submissions (created_at desc);

create trigger contacts_updated_at
  before update on public.contact_submissions
  for each row execute function public.update_updated_at();

-- お知らせ
create table public.news (
  id          serial primary key,
  category    text not null default 'お知らせ',
  title       text not null,
  body        text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.news is 'お知らせ記事';

create index idx_news_published on public.news (is_published, published_at desc) where is_published = true;

create trigger news_updated_at
  before update on public.news
  for each row execute function public.update_updated_at();

-- キャンペーン
create table public.campaigns (
  id          serial primary key,
  category    text not null default '期間限定',
  title       text not null,
  description text not null default '',
  start_date  timestamptz not null,
  end_date    timestamptz,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.campaigns is 'キャンペーン';

create index idx_campaigns_active on public.campaigns (is_active, start_date desc) where is_active = true;

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();

-- RLS
alter table public.contact_submissions enable row level security;
alter table public.news enable row level security;
alter table public.campaigns enable row level security;

-- contacts: 本人のみ作成、閲覧不可（管理画面から見る想定）
create policy "誰でもお問い合わせ送信可"
  on public.contact_submissions for insert with check (true);

-- news: 公開記事は誰でも閲覧
create policy "公開記事は誰でも閲覧可"
  on public.news for select using (is_published = true);

-- campaigns: アクティブなキャンペーンは誰でも閲覧
create policy "アクティブなキャンペーンは誰でも閲覧可"
  on public.campaigns for select using (is_active = true);

-- ============================================================
-- 初期データ
-- ============================================================
insert into public.news (category, title, body, is_published, published_at) values
  ('お知らせ', '新クエスト「古い携帯の未送信メッセージ」配信開始', '感動のヒューマンドラマ系クエストが新登場。古い携帯電話に残された未送信メッセージから、10年前の想いを紐解く物語。一人でじっくり楽しめる自宅完結型クエストです。', true, '2026-03-01'),
  ('メンテナンス', 'システムメンテナンスのお知らせ（3/10 深夜）', '3月10日 深夜2:00〜5:00の間、システムメンテナンスを実施いたします。この間、クエスト受注や決済がご利用いただけません。ご不便をおかけしますが、ご了承ください。', true, '2026-02-20'),
  ('アップデート', 'レビュー機能をアップデートしました', '冒険者レビューに「できたえ」「ストーリー」「ボリューム」の3項目サブ評価を追加しました。より詳細なレビューが可能になり、クエスト選びの参考になります。', true, '2026-02-10');

insert into public.campaigns (category, title, description, start_date, end_date, is_active) values
  ('期間限定', '春の冒険キャンペーン', '期間中にクエストを受注すると、通常の2倍のコインを獲得！さらに3つ以上クリアで限定称号「春の勇者」をプレゼント。', '2026-03-01', '2026-03-31', true),
  ('友達紹介', '友達紹介ダブルコインキャンペーン', '友達を紹介して、お互いに100コインGET！紹介された方も初回クエスト10%OFF。', '2026-02-15', '2026-04-15', true),
  ('コラボ', '【予告】地域コラボクエスト', '全国の観光地とコラボした限定クエストが登場予定。ご当地アイテム付きの特別クエストをお楽しみに。', '2026-04-01', null, false);
