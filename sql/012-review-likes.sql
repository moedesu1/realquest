-- ============================================================
-- レビュー「参考になった」テーブル作成
-- ============================================================
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS public.review_likes (
  id         serial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id  int NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, review_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "参考になったは誰でも閲覧可"
  ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "参考になったは本人のみ追加"
  ON public.review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "参考になったは本人のみ削除"
  ON public.review_likes FOR DELETE USING (auth.uid() = user_id);
