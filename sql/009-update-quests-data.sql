-- ============================================================
-- REALQUEST クエストデータ更新
-- ============================================================
-- 【実行方法】
--   1. https://supabase.com にログイン
--   2. REALQUESTのプロジェクトを開く
--   3. 左メニューの「SQL Editor」をクリック
--   4. この内容を全部コピペして「Run」ボタンを押す
-- ============================================================

-- まず既存のアイテムデータを削除（新しいデータで入れ直す）
DELETE FROM public.quest_items;

-- クエスト1: 神戸異聞録
UPDATE public.quests SET
  title = '神戸異聞録 ― 港町の消えた宝石商',
  tagline = '北野異人館街に眠る、百年前の未解決事件',
  genre = '推理',
  sub_genre = 'フィールド探索',
  price = 3500,
  difficulty = 3,
  image_url = 'images/quest-1-new.png',
  estimated_time = '3〜5時間',
  players = '1〜4人',
  region = '神戸・北野〜メリケンパーク',
  format = 'outdoor',
  is_new = true,
  category = 'beginner',
  prologue = '1923年、神戸北野の異人館から一人の宝石商が忽然と姿を消した。残されたのは暗号が刻まれた懐中時計と、港を示す古地図。百年の時を経て、あなたの元に届いた一通の手紙がすべてを動かす。メリケンパークから北野坂を辿り、この街に隠された真実を解き明かせ。',
  cautions = ARRAY['歩きやすい靴推奨', '雨天決行', 'スマートフォン必須', '対象年齢: 12歳以上'],
  review_avg = 0, review_count = 0, sales_count = 0
WHERE id = 1;

-- クエスト2: 団地の灯
UPDATE public.quests SET
  title = '団地の灯 ― 404号室の住人',
  tagline = 'あの部屋の灯りは、誰が点けているのか',
  genre = 'ホラー',
  sub_genre = 'サスペンス',
  price = 2500,
  difficulty = 2,
  image_url = 'images/quest-2-new.png',
  estimated_time = '2〜3時間',
  players = '1〜2人',
  region = '自宅完結',
  format = 'home',
  is_new = true,
  category = 'beginner',
  prologue = '取り壊しが決まった昭和の団地。全住民が退去したはずの建物で、404号室だけ毎晩灯りが点く。管理会社から届いた調査依頼。部屋の鍵と共に届いた資料には、30年前にこの部屋で起きた「あの事件」の記録が入っていた。',
  cautions = ARRAY['ホラー要素あり', '対象年齢: 15歳以上', 'LINEアプリ必須'],
  review_avg = 0, review_count = 0, sales_count = 0
WHERE id = 2;

-- クエスト3: 商店街の亡霊
UPDATE public.quests SET
  title = '商店街の亡霊 ― ネオンに消えた歌姫',
  tagline = '昭和の商店街に響く、幻のメロディー',
  genre = '推理',
  sub_genre = 'ミステリー',
  price = 3000,
  difficulty = 2,
  image_url = 'images/quest-3-new.png',
  estimated_time = '2〜4時間',
  players = '1〜3人',
  region = '自宅完結',
  format = 'home',
  is_new = false,
  category = 'beginner',
  prologue = 'かつて賑わったアーケード商店街。閉店後の深夜、どこからか昭和歌謡が聞こえるという噂が絶えない。調査を始めたあなたの元に届いたのは、40年前に姿を消した歌手のレコードと、商店街の裏の顔を記した手帳だった。',
  cautions = ARRAY['ネタバレ厳禁', '筆記用具推奨', '対象年齢: 12歳以上'],
  review_avg = 0, review_count = 0, sales_count = 0
WHERE id = 3;

-- クエスト4: 鎮守の森
UPDATE public.quests SET
  title = '鎮守の森 ― 千年杉の神隠し',
  tagline = '奉納箱の中に、あなた宛の御神託が入っていた',
  genre = '冒険',
  sub_genre = 'フィールド探索',
  price = 3500,
  difficulty = 3,
  image_url = 'images/quest-4-new.png',
  estimated_time = '3〜5時間',
  players = '1〜4人',
  region = '奈良・山の辺の道周辺',
  format = 'outdoor',
  is_new = false,
  category = 'beginner',
  prologue = '奈良の古社に伝わる「神隠しの言い伝え」。千年杉の根元に置かれた奉納箱を開けると、中にはあなたの名前が書かれた御神託が入っていた。古代の参道を辿り、石灯籠に刻まれた暗号を解読し、鎮守の森の奥に眠る秘密に辿り着け。',
  cautions = ARRAY['歩きやすい靴・服装必須', '山道あり', '雨天延期', '対象年齢: 10歳以上'],
  review_avg = 0, review_count = 0, sales_count = 0
WHERE id = 4;

-- クエスト5: 路地裏の密約
UPDATE public.quests SET
  title = '路地裏の密約 ― 花街スパイ・ゲーム',
  tagline = '石畳の先に、裏切り者がいる',
  genre = 'スパイ',
  sub_genre = '潜入ミッション',
  price = 4000,
  difficulty = 4,
  image_url = 'images/quest-5-new.png',
  estimated_time = '3〜5時間',
  players = '2〜6人',
  region = '自宅完結',
  format = 'home',
  is_new = false,
  category = 'advanced',
  prologue = '京都の花街に潜むスパイ網。あなたは組織から極秘任務を受ける。石畳の路地裏で行われる密約の現場に潜入し、二重スパイを特定せよ。ただし、仲間の中にも裏切り者がいるかもしれない。信じるか、疑うか。すべてはあなた次第。',
  cautions = ARRAY['対象年齢: 15歳以上', '複数人推奨', '裏切り要素あり'],
  review_avg = 0, review_count = 0, sales_count = 0
WHERE id = 5;

-- クエスト6: 廃校の記憶
UPDATE public.quests SET
  title = '廃校の記憶 ― 最後の卒業式',
  tagline = '誰もいない教室で、チャイムが鳴った',
  genre = 'ホラー',
  sub_genre = '脱出系',
  price = 3000,
  difficulty = 3,
  image_url = 'images/quest-6-new.png',
  estimated_time = '2〜4時間',
  players = '1〜3人',
  region = '自宅完結',
  format = 'home',
  is_new = true,
  category = 'advanced',
  prologue = '15年前に廃校になった小学校。取り壊し前の最終調査に訪れたあなたは、職員室で一冊の卒業アルバムを見つける。そこに写る子どもたちの顔は全員黒く塗りつぶされていた。突然、校内放送が流れ始める。「最後の卒業式を、始めます」',
  cautions = ARRAY['ホラー要素強め', '対象年齢: 15歳以上', '暗い場所でのプレイ推奨'],
  review_avg = 0, review_count = 0, sales_count = 0
WHERE id = 6;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 新しいアイテムデータを挿入
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO public.quest_items (quest_id, icon, name, sort_order) VALUES
  -- クエスト1: 神戸異聞録
  (1, '◆', '捜査資料ファイル（古地図・証拠写真入り）', 1),
  (1, '◆', '暗号が刻まれたレプリカ懐中時計', 2),
  (1, '◆', '宝石商からの手紙（封蝋付き）', 3),
  -- クエスト2: 団地の灯
  (2, '◆', '404号室の鍵（レプリカ）', 1),
  (2, '◆', '管理会社からの調査依頼書', 2),
  (2, '◆', '住民台帳の写し（一部黒塗り）', 3),
  -- クエスト3: 商店街の亡霊
  (3, '◆', '幻のレコードジャケット（復刻版）', 1),
  (3, '◆', '商店街の見取り図', 2),
  (3, '◆', '謎の手帳（暗号入り）', 3),
  -- クエスト4: 鎮守の森
  (4, '◆', '御神託の巻物（和紙製）', 1),
  (4, '◆', '参道の古地図', 2),
  (4, '◆', '石灯籠の拓本シート', 3),
  -- クエスト5: 路地裏の密約
  (5, '◆', '極秘任務指令書（封蝋付き）', 1),
  (5, '◆', 'エージェント手帳', 2),
  (5, '◆', '花街の路地裏マップ', 3),
  (5, '◆', '正体カード（人数分）', 4),
  -- クエスト6: 廃校の記憶
  (6, '◆', '卒業アルバム（復刻版・一部黒塗り）', 1),
  (6, '◆', '校内見取り図', 2),
  (6, '◆', '職員室の鍵', 3);
