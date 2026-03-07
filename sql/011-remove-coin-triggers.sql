-- ============================================================
-- コイン関連トリガー削除
-- ============================================================
-- Supabase SQL Editor で実行してください

-- レビュー投稿時のコイン付与トリガーを削除
DROP TRIGGER IF EXISTS on_review_created_coins ON public.reviews;
DROP FUNCTION IF EXISTS public.reward_review_coins();

-- 注文完了時のコイン付与を削除（関数を修正）
CREATE OR REPLACE FUNCTION public.handle_order_completed()
RETURNS trigger AS $$
BEGIN
  IF new.status = 'completed' AND old.status != 'completed' THEN
    UPDATE public.profiles
    SET quests_completed = quests_completed + 1
    WHERE id = new.user_id;

    UPDATE public.quests
    SET sales_count = sales_count + 1
    WHERE id = new.quest_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
