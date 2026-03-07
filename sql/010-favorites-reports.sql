-- ============================================================
-- お気に入り + 通報テーブル作成
-- ============================================================
-- Supabase SQL Editor で実行してください

-- お気に入り
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id  int NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "お気に入り閲覧は本人のみ"
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "お気に入り追加は本人のみ"
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "お気に入り削除は本人のみ"
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- 通報
CREATE TABLE IF NOT EXISTS public.reports (
  id          serial PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  quest_id    int REFERENCES public.quests(id) ON DELETE CASCADE,
  review_id   int,
  reason      text NOT NULL,
  detail      text DEFAULT '',
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','resolved','dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "誰でも通報可"
  ON public.reports FOR INSERT WITH CHECK (true);
