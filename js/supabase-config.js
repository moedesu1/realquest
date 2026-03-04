/* ============================================================
   Supabase Client Configuration
   ============================================================ */

// TODO: 本番デプロイ前に自分のSupabaseプロジェクトの値に差し替え
const SUPABASE_URL = 'https://dlnjskoybszuailyfqkg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oO1y9WdmmIAw0JBc-aHGFg_0KZEHLAZ';

const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Supabase未設定時はデモモードで動作
const isSupabaseConfigured = SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co';

/* ============================================================
   Shopify Configuration
   ============================================================ */

const SHOPIFY_STORE_DOMAIN = 'tsq1v8-fq.myshopify.com';

// クエストID → Shopify Variant ID マッピング
// 取得方法: Shopify管理画面 > 商品管理 > 商品をクリック > URLの末尾がProduct ID
//          商品ページ下部「バリエーション」のIDを使用
const SHOPIFY_VARIANT_MAP = {
  1: '44926584684598',   // 大阪怪奇事件ファイル
  2: '44926668177462',   // 奈良・消えた鹿の暗号
  3: '44926682300470',   // 古い携帯の未送信メッセージ
  4: '44926683578422',   // 失われた財布の秘密
  5: '44926684397622',   // 闇オークションのボードゲーム
  6: '44926688591926',   // 回復のポーション
};

const isShopifyConfigured = Object.values(SHOPIFY_VARIANT_MAP).some(v => v !== null);
