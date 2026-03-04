-- ============================================================
-- 002: quests + quest_items — クエストカタログ
-- ============================================================

create table public.quests (
  id              serial primary key,
  title           text not null,
  tagline         text not null default '',
  rank            text not null default 'C' check (rank in ('S','A','B','C','D','E','F')),
  difficulty      int not null default 1 check (difficulty between 0 and 5),
  price           int not null default 0,
  category        text not null default 'beginner' check (category in ('beginner','advanced')),
  format          text not null default 'home' check (format in ('home','outdoor','hybrid')),
  genre           text not null default '',
  sub_genre       text not null default '',
  is_new          boolean not null default false,
  image_url       text not null default '',
  estimated_time  text not null default '',
  players         text not null default '',
  region          text not null default '自宅完結',
  prologue        text not null default '',
  cautions        text[] not null default '{}',
  shopify_product_id   text,          -- Shopify 商品ID
  shopify_variant_id   text,          -- Shopify バリアントID
  review_avg      numeric(2,1) not null default 0,
  review_count    int not null default 0,
  sales_count     int not null default 0,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.quests is 'クエストカタログ（Shopify商品と紐付け）';

create index idx_quests_published on public.quests (is_published) where is_published = true;
create index idx_quests_category on public.quests (category);
create index idx_quests_format on public.quests (format);

-- クエスト支給アイテム
create table public.quest_items (
  id        serial primary key,
  quest_id  int not null references public.quests(id) on delete cascade,
  icon      text not null default '◆',
  name      text not null,
  sort_order int not null default 0
);

comment on table public.quest_items is 'クエスト支給アイテム';
create index idx_quest_items_quest on public.quest_items (quest_id);

-- updated_at トリガー
create trigger quests_updated_at
  before update on public.quests
  for each row execute function public.update_updated_at();

-- RLS
alter table public.quests enable row level security;
alter table public.quest_items enable row level security;

create policy "公開クエストは誰でも閲覧可"
  on public.quests for select using (is_published = true);

create policy "アイテムは誰でも閲覧可"
  on public.quest_items for select using (true);

-- ============================================================
-- 初期データ投入
-- ============================================================
insert into public.quests (title, tagline, rank, difficulty, price, category, format, genre, sub_genre, is_new, image_url, estimated_time, players, region, prologue, cautions, review_avg, review_count, sales_count, is_published) values
  ('大阪怪奇事件ファイル', '未解決事件の真相が、あなたの手元に届く——', 'B', 2, 3000, 'beginner', 'home', '推理', 'ミステリー', true, 'images/quest-1-alchemy.webp', '2〜4時間', '1〜3人', '自宅完結', '大阪で起きた連続怪奇事件——目撃者の証言は矛盾だらけ、現場には説明のつかない痕跡が残されていた。捜査本部がギルドに依頼した資料一式があなたの元に届く。封筒の中の鍵は、何を開けるためのものなのか。真相は、証拠の中に隠されている。', array['ネタバレ禁止','筆記用具をご用意ください','対象年齢: 12歳以上'], 4.7, 24, 156, true),
  ('奈良・消えた鹿の暗号', '古都に眠る暗号が、あなたを導く——', 'A', 3, 3500, 'advanced', 'hybrid', '暗号解読', '歴史冒険', false, 'images/quest-2-library.webp', '3〜5時間', '1〜4人', '奈良', '奈良公園の鹿が一頭、忽然と姿を消した。ただの迷子ではない——その鹿は、千年前から受け継がれてきた「神鹿」だった。古びた手紙に記された暗号を解けば、消えた鹿の行方と、古都に隠された秘密に辿り着ける。', array['ネタバレ禁止','現地ステージあり（奈良市内）','歩きやすい服装推奨','対象年齢: 12歳以上'], 4.5, 18, 112, true),
  ('古い携帯の未送信メッセージ', '10年前の想いが、今あなたの手元に——', 'C', 1, 2800, 'beginner', 'home', '謎解き', 'ヒューマンドラマ', true, 'images/quest-3-ruins.webp', '1〜2時間', '1人', '自宅完結', 'リサイクルショップで見つかった古い携帯電話。電源を入れると、下書きフォルダに未送信のメッセージが残されていた。誰が、誰に、何を伝えようとしていたのか——。携帯に残された手がかりから、10年前の想いを紐解け。', array['ネタバレ禁止','対象年齢: 10歳以上'], 4.9, 31, 89, true),
  ('失われた財布の秘密', '誰かの日常が、あなたの謎になる——', 'B', 2, 4000, 'beginner', 'home', '推理', 'リアルミステリー', false, 'images/quest-4-clocktower.webp', '2〜3時間', '1〜2人', '自宅完結', 'ギルドに届けられた落とし物——誰かの財布。中にはレシート、身分証、メモ、写真が入っている。持ち主を探すだけの簡単な依頼のはずだった。だが中身を調べるうちに、この財布が「落とされた」のではなく「残された」ものだと気づく。', array['ネタバレ禁止','筆記用具をご用意ください','対象年齢: 12歳以上'], 4.3, 15, 78, true),
  ('闇オークションのボードゲーム', '招待されし者だけが、ゲームに参加できる——', 'A', 3, 4500, 'advanced', 'home', '体験型', 'ボードゲーム', true, 'images/quest-5-deepsea.webp', '3〜5時間', '2〜5人', '自宅完結', '届いたのは、封蝋で封じられた一通の招待状。「闇オークション」への参加権と、そこで使う専用ボードゲームが同封されていた。ゲームのルールは単純だが、裏には隠されたルールがある。全てのカードを読み解いた時、オークションの真の目的が明らかになる。', array['ネタバレ禁止','2人以上での挑戦推奨','対象年齢: 15歳以上'], 4.8, 42, 203, true),
  ('回復のポーション', 'ヒントと共に、冒険の活力を——', 'C', 0, 500, 'beginner', 'home', '体験型', '共通アイテム', false, 'images/quest-6-potionshop.webp', '—', '—', '自宅完結', '冒険に疲れた時、行き詰まった時——この「回復のポーション」があなたを助ける。リアクエ専用ドリンクと共に届くカードには、各クエストで使えるヒント解放コードが封入されている。飲んで、読んで、再び冒険へ。', array['賞味期限をご確認ください','各クエストのヒントは1回限り'], 4.6, 35, 267, true);

-- 支給アイテム
insert into public.quest_items (quest_id, icon, name, sort_order) values
  (1, '◆', '捜査資料ファイル（証拠写真・調書入り）', 1),
  (1, '◆', '謎の鍵（金属製）', 2),
  (1, '◆', '捜査本部からの依頼書', 3),
  (2, '◆', '古びた手紙（暗号入り）', 1),
  (2, '◆', '木札（ヒント刻印入り）', 2),
  (2, '◆', 'ギルドからの依頼書', 3),
  (3, '◆', '古い携帯電話本体（ギミック内蔵）', 1),
  (3, '◆', 'ギルドからの依頼書', 2),
  (4, '◆', '誰かの財布（レシートや身分証入り）', 1),
  (4, '◆', 'ギルドからの依頼書', 2),
  (5, '◆', '招待状（封蝋付き）', 1),
  (5, '◆', '専用ボードゲーム一式', 2),
  (5, '◆', 'ギルド最高機密依頼書', 3),
  (6, '◆', 'リアクエ専用ドリンク', 1),
  (6, '◆', 'ヒント解放コード付きカード', 2);
