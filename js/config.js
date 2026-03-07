/* ============================================================
   REAL QUEST — Configuration
   ============================================================

   セットアップ手順:
   1. Supabase (https://supabase.com)
      - プロジェクト作成 → Settings > API から URL と anon key を取得
      - sql/ フォルダの 001〜006 を SQL Editor で順番に実行
      - Authentication > URL Configuration でサイトURLを設定

   2. Shopify (https://shopify.com)
      - ストア作成 → 6クエストに対応する商品を作成
      - Settings > Apps > Storefront API からトークン取得
      - 各商品の variant ID を Supabase の quests テーブルに設定:
        UPDATE quests SET shopify_variant_id = 'gid://...' WHERE id = N;

   3. Google Analytics 4
      - GA4 プロパティ作成 → 測定ID (G-XXXXXXXXXX) を設定

   ※ .gitignore に config.js を追加し、本番キーをリポジトリに含めないこと
   ============================================================ */

const RQ_CONFIG = {
  // ── Supabase ──
  // Supabase ダッシュボード > Settings > API から取得
  SUPABASE_URL: 'https://dlnjskoybszuailyfqkg.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbmpza295YnN6dWFpbHlmcWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk0MDgsImV4cCI6MjA4ODEzNTQwOH0.vjLtkWDkSL35MUtYDKKP1u8PPOd2HonW4TYmgF75G_c',

  // ── Shopify Storefront ──
  // Shopify 管理画面 > Settings > Apps > Storefront API
  SHOPIFY_DOMAIN: 'tsq1v8-fq.myshopify.com',
  SHOPIFY_STOREFRONT_TOKEN: '1d2cd654df39aa7b6f87fc212840bb06',

  // ── Shopify Variant ID マッピング ──
  // クエストID → Shopify Variant ID
  SHOPIFY_VARIANT_MAP: {
    1: '44926584684598',   // 大阪怪奇事件ファイル
    2: '44926668177462',   // 奈良・消えた鹿の暗号
    3: '44926682300470',   // 古い携帯の未送信メッセージ
    4: '44926683578422',   // 失われた財布の秘密
    5: '44926684397622',   // 闇オークションのボードゲーム
    6: '44926688591926',   // 回復のポーション
  },

  // ── microCMS ──
  MICROCMS_DOMAIN: 'realquest',
  MICROCMS_API_KEY: 'PP7u0vGyX42sNyq3UOqXVnkx33zIBLhNEA7X',

  // ── Google Analytics 4 ──
  GA4_ID: 'G-XXXXXXXXXX',
};
