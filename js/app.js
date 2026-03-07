/* ============================================================
   REALQUEST — App (Antique Bookshop Theme)
   Supabase Auth/DB + Shopify Cart preserved
   ============================================================ */

/* ── SUPABASE CLIENT ── */
let db = null;
function initSupabase() {
  try {
    if (typeof window.supabase !== 'undefined' && RQ_CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
      db = window.supabase.createClient(RQ_CONFIG.SUPABASE_URL, RQ_CONFIG.SUPABASE_ANON_KEY);
    }
  } catch (e) { console.warn('Supabase init failed:', e); }
}

/* ── SHOPIFY CLIENT ── */
let shopifyClient = null;
let shopifyCheckout = null;

async function initShopify() {
  try {
    if (typeof ShopifyBuy === 'undefined') return;
    shopifyClient = ShopifyBuy.buildClient({
      domain: RQ_CONFIG.SHOPIFY_DOMAIN,
      storefrontAccessToken: RQ_CONFIG.SHOPIFY_STOREFRONT_TOKEN,
    });
    const savedId = localStorage.getItem('rq_checkout_id');
    if (savedId) {
      try {
        shopifyCheckout = await shopifyClient.checkout.fetch(savedId);
        if (shopifyCheckout.completedAt) {
          // 決済完了 → カート内商品を購入済みに更新
          await markCartAsPurchased();
          shopifyCheckout = await shopifyClient.checkout.create();
          localStorage.setItem('rq_checkout_id', shopifyCheckout.id);
        }
      } catch {
        shopifyCheckout = await shopifyClient.checkout.create();
        localStorage.setItem('rq_checkout_id', shopifyCheckout.id);
      }
    } else {
      shopifyCheckout = await shopifyClient.checkout.create();
      localStorage.setItem('rq_checkout_id', shopifyCheckout.id);
    }
    updateCartBadge();
  } catch (e) { console.warn('Shopify init failed:', e); }
}

/* ── STATE ── */
let allQuests = [];
let reviewsByQuest = {};
let currentCategory = 'all';
let currentPage = 'opening';

const userState = {
  loggedIn: false,
  userId: null,
  name: '',
  email: '',
  avatar: '',
  acceptedQuests: [],
  purchasedQuests: [],
};

/* ── FALLBACK QUEST DATA ── */
const FALLBACK_QUESTS = [
  {
    id: 1, title: '夢の国急行 ― 都市遊園地への旅',
    tagline: 'レトロな路面電車の切符が、失われた遊園地への片道切符だった',
    genre: '冒険', subGenre: '街歩きファンタジー',
    price: 3000, difficulty: 2,
    image: 'images/quest-1-dreamland.jpg',
    estimatedTime: '2〜4時間', players: '1〜4人',
    region: '大阪・新世界〜天王寺周辺', format: 'outdoor',
    isNew: true, isOfficial: true,
    prologue: '古い切符売り場で見つけた一枚の乗車券。行き先には「夢の国遊園地」と印字されているが、そんな遊園地は地図のどこにも載っていない。切符の裏に書かれたヒントを頼りに街を歩くと、レトロな看板、古びた時計塔、色褪せたサーカスのポスター――かつて街に実在した幻の遊園地の痕跡が次々と浮かび上がる。驚きの世界へ続く最終ゲートを見つけ出し、夢の国急行に乗車せよ。',
    cautions: ['歩きやすい靴推奨', '雨天決行', 'スマートフォン必須', '対象年齢: 全年齢'],
    reviewAvg: 4.8, reviewCount: 18, salesCount: 245,
    creatorName: 'QUESTORE公式', creatorSns: '',
    items: [
      { icon: '◆', name: '夢の国遊園地 乗車券（レトロ復刻版）' },
      { icon: '◆', name: '幻の遊園地マップ（古地図風）' },
      { icon: '◆', name: 'サーカス団の暗号カード（全6枚）' },
      { icon: '◆', name: '時計塔の鍵（レプリカ）' },
    ],
  },
  {
    id: 2, title: '放課後の招待状 ― 平成の教室',
    tagline: 'あの頃の放課後が、謎解きの舞台になる',
    genre: '冒険', subGenre: '平成レトロ×謎解き',
    price: 2500, difficulty: 1,
    image: 'images/quest-2-heisei.jpg',
    estimatedTime: '1〜3時間', players: '1〜6人',
    region: '大阪・中崎町〜天満周辺', format: 'outdoor',
    isNew: true, isOfficial: true,
    prologue: '机の引き出しから出てきた一枚のシール帳。たまごっち、交換日記、プリクラ――平成の思い出が詰まったその裏に「放課後、いつもの場所で待ってる」と書かれていた。懐かしい文房具屋、駄菓子屋、ゲームセンターを巡りながら、あの頃の友達が残した暗号を解き明かそう。最後に届くのは、あなただけへの手紙。',
    cautions: ['スマートフォン必須', '対象年齢: 全年齢', '懐かしさで泣くかもしれません'],
    reviewAvg: 4.9, reviewCount: 24, salesCount: 380,
    creatorName: 'QUESTORE公式', creatorSns: '',
    items: [
      { icon: '◆', name: '平成シール帳（復刻版・暗号入り）' },
      { icon: '◆', name: '交換日記ノート（手がかり付き）' },
      { icon: '◆', name: '駄菓子屋マップ' },
      { icon: '◆', name: 'あなたへの手紙（クリア後開封）' },
    ],
  },
  {
    id: 3, title: '湯煙の失踪 ― 温泉街最後の手がかり',
    tagline: '湯気の向こうに消えた旅人の行方を追え',
    genre: '推理', subGenre: 'フィールド探索',
    price: 3500, difficulty: 3,
    image: 'images/quest-3-new.webp',
    estimatedTime: '3〜5時間', players: '2〜4人',
    region: '有馬温泉・温泉街周辺', format: 'outdoor',
    isNew: false, isOfficial: true,
    prologue: '有馬温泉の老舗旅館で、一人の旅行客が忽然と姿を消した。部屋に残されていたのは、温泉街の店を巡るスタンプカードと、裏面に書かれた謎めいた数字の羅列。湯煙が立ち上る石畳の通りを歩き、土産物屋や足湯の番台に散りばめられた手がかりを集め、消えた旅人の真実に迫れ。',
    cautions: ['歩きやすい靴推奨', '雨天決行', 'スマートフォン必須', '対象年齢: 12歳以上'],
    reviewAvg: 4.5, reviewCount: 6, salesCount: 134,
    creatorName: 'REALQUEST公式', creatorSns: '',
    items: [
      { icon: '◆', name: '旅行客の手帳（暗号メモ入り）' },
      { icon: '◆', name: '温泉街スタンプカード' },
      { icon: '◆', name: '老舗旅館の宿帳の写し' },
    ],
  },
  {
    id: 4, title: '鎮守の森 ― 千年杉の神隠し',
    tagline: '奉納箱の中に、あなた宛の御神託が入っていた',
    genre: '冒険', subGenre: 'フィールド探索',
    price: 3500, difficulty: 3,
    image: 'images/quest-4-new.webp',
    estimatedTime: '3〜5時間', players: '1〜4人',
    region: '奈良・山の辺の道周辺', format: 'outdoor',
    isNew: false, isOfficial: true,
    prologue: '奈良の古社に伝わる「神隠しの言い伝え」。千年杉の根元に置かれた奉納箱を開けると、中にはあなたの名前が書かれた御神託が入っていた。鳥居をくぐり、苔むした石灯籠が並ぶ参道を辿り、暗号を解読し、鎮守の森の奥に眠る秘密に辿り着け。',
    cautions: ['歩きやすい靴・服装必須', '山道あり', '雨天延期', '対象年齢: 10歳以上'],
    reviewAvg: 4.9, reviewCount: 15, salesCount: 89,
    creatorName: 'REALQUEST公式', creatorSns: '',
    items: [
      { icon: '◆', name: '御神託の巻物（和紙製）' },
      { icon: '◆', name: '参道の古地図' },
      { icon: '◆', name: '石灯籠の拓本シート' },
    ],
  },
  {
    id: 5, title: '古都の宝探し ― 失われた絵師の地図',
    tagline: '古びた宝の地図が、街を冒険に変える',
    genre: '冒険', subGenre: 'トレジャーハント',
    price: 4000, difficulty: 4,
    image: 'images/quest-5-new.webp',
    estimatedTime: '4〜6時間', players: '2〜6人',
    region: '京都・祇園〜東山エリア', format: 'outdoor',
    isNew: false, isOfficial: true,
    prologue: '京都の古書店で見つかった、江戸時代の絵師が遺した一枚の地図。山、川、寺社の記号と謎の暗号文字が描かれたその地図は、絵師が生涯をかけて集めた「ある宝」の在処を示しているという。祇園の路地から東山の寺社へ、地図を片手に街を歩き、200年の時を超えた宝探しに挑め。',
    cautions: ['歩きやすい靴必須', '長距離歩行あり', 'スマートフォン必須', '対象年齢: 12歳以上'],
    reviewAvg: 4.6, reviewCount: 9, salesCount: 178,
    creatorName: 'REALQUEST公式', creatorSns: '',
    items: [
      { icon: '◆', name: '絵師の宝の地図（古紙レプリカ）' },
      { icon: '◆', name: '暗号解読ガイドブック' },
      { icon: '◆', name: '探索チェックリスト' },
      { icon: '◆', name: '方位磁石（レプリカ）' },
    ],
  },
  {
    id: 6, title: '黄昏の街 ― 五重塔に沈む真実',
    tagline: '夕暮れの京都で、街全体が謎解きの舞台になる',
    genre: '推理', subGenre: '街歩きミステリー',
    price: 3000, difficulty: 2,
    image: 'images/quest-6-new.webp',
    estimatedTime: '2〜4時間', players: '1〜4人',
    region: '京都・清水寺〜八坂周辺', format: 'outdoor',
    isNew: true, isOfficial: true,
    prologue: '夕暮れの京都。清水坂から二年坂、八坂の塔を望む街並みに、一人の写真家が最後に撮った9枚の写真が遺されていた。それぞれの写真には不自然な影と、裏面に走り書きされた一行のメッセージ。日が沈む前に、写真と同じ場所を巡り、写真家が命を懸けて伝えようとした真実を解き明かせ。',
    cautions: ['夕方開始推奨（16時頃〜）', '歩きやすい靴推奨', 'スマートフォン必須', '対象年齢: 12歳以上'],
    reviewAvg: 4.7, reviewCount: 11, salesCount: 267,
    creatorName: 'REALQUEST公式', creatorSns: '',
    items: [
      { icon: '◆', name: '写真家の9枚の写真（復刻版）' },
      { icon: '◆', name: '街歩きマップ' },
      { icon: '◆', name: '写真家の日記（抜粋）' },
    ],
  },
  {
    id: 7, title: 'おかんPの8bit商店街 ― ロックママの隠しトラック',
    tagline: 'ゲーム音楽の伝説が仕掛けた、商店街まるごと音の謎解き',
    genre: '冒険', subGenre: '音楽×街歩き',
    price: 2500, difficulty: 2,
    image: 'images/quest-7-okanp.jpg',
    estimatedTime: '2〜3時間', players: '1〜4人',
    region: '大阪・豊中〜庄内商店街周辺', format: 'outdoor',
    isNew: true, isOfficial: true,
    prologue: '伝説のゲーム音楽作曲家「おかんP」こと藤田晴美。ロックマン3やファイナルファイトの旋律を生んだ彼女が、地元・大阪の商店街にある"音の暗号"を仕掛けた。商店街のBGM、自販機のメロディ、踏切の警告音――街に溢れる音の中に、アルバム「ロックママ」の隠しトラックへの手がかりが眠っている。8bitの記憶を辿り、おかんPが街に隠した最後の1曲を見つけ出せ。',
    cautions: ['イヤホン持参推奨', 'スマートフォン必須', '対象年齢: 全年齢', '商店街の営業時間内に開始してください'],
    reviewAvg: 4.8, reviewCount: 14, salesCount: 312,
    creatorName: 'おかんP × Cloud Illusion', creatorSns: '@soundfujita',
    items: [
      { icon: '◆', name: 'おかんP直筆サイン入りロックママCD' },
      { icon: '◆', name: '8bit音の暗号カード（全8枚）' },
      { icon: '◆', name: '商店街マップ（おかんP描き下ろしイラスト入り）' },
      { icon: '◆', name: '隠しトラック解放コード' },
    ],
  },
];

const FALLBACK_REVIEWS = {
  1: [
    { id: 101, user: '冒険好きファミリー', stars: 5, text: '子供が大興奮！レトロな乗車券のクオリティが高くて、本当に幻の遊園地に向かってる気分になった。新世界の街並みとの相性も抜群。', date: '2026-03-01', likeCount: 14 },
    { id: 102, user: '街歩きマニア', stars: 5, text: '大阪に住んでるけど知らなかった歴史がたくさん。古地図を片手に歩くのがワクワクする。時計塔の鍵の演出に鳥肌。', date: '2026-02-22', likeCount: 10 },
    { id: 103, user: 'レトロ好き', stars: 4, text: 'ポスターの世界観そのまま！サーカスの暗号カードが可愛くて、謎解き後もコレクションとして飾ってます。', date: '2026-02-10', likeCount: 7 },
  ],
  2: [
    { id: 201, user: '平成生まれ', stars: 5, text: 'シール帳を開いた瞬間に小学校の記憶が蘇って泣きそうになった。駄菓子屋のおばちゃんも協力してくれて最高。', date: '2026-03-03', likeCount: 20 },
    { id: 202, user: '母と娘で参加', stars: 5, text: '母が「懐かしい！」と大はしゃぎ。世代を超えて楽しめる素敵な体験でした。最後の手紙で二人とも号泣。', date: '2026-02-25', likeCount: 16 },
    { id: 203, user: 'レトロ雑貨好き', stars: 5, text: '交換日記ノートのデザインが完璧すぎる。謎解き終わっても大事に使ってます。中崎町の雰囲気にもぴったり。', date: '2026-02-18', likeCount: 11 },
  ],
  3: [
    { id: 301, user: '温泉好きの探偵', stars: 4, text: '有馬温泉の街歩きと謎解きが両方楽しめる。足湯に浸かりながら手がかりを考えるのが贅沢な時間でした。', date: '2026-01-30', likeCount: 6 },
    { id: 302, user: '家族で冒険', stars: 5, text: '中学生の子供と一緒に参加。温泉街のお店の人も協力的で、子供も大人も楽しめました。', date: '2026-01-18', likeCount: 4 },
  ],
  4: [
    { id: 401, user: '森の冒険者', stars: 5, text: '鎮守の森の雰囲気が圧倒的。千年杉の前に立った時は鳥肌が立ちました。御神託の演出も素晴らしい。', date: '2026-02-25', likeCount: 15 },
    { id: 402, user: '自然派ハイカー', stars: 5, text: '山の辺の道を歩きながらの謎解きは最高の体験。体力は少し必要だけど、達成感は一番。', date: '2026-02-12', likeCount: 9 },
    { id: 403, user: 'リピーター', stars: 5, text: '2回目の参加。季節が変わると森の雰囲気も変わって、また違った楽しみ方ができました。', date: '2026-01-28', likeCount: 6 },
  ],
  5: [
    { id: 501, user: 'トレジャーハンター', stars: 5, text: '宝の地図のクオリティが高すぎる。古紙レプリカの質感が本物みたいで、冒険気分が一気に高まる。', date: '2026-02-18', likeCount: 10 },
    { id: 502, user: '歴史オタク', stars: 4, text: '江戸時代の絵師の設定がよく作り込まれていて、歴史好きにはたまらない。ただ歩く距離が長いので体力は必要。', date: '2026-02-05', likeCount: 5 },
  ],
  6: [
    { id: 601, user: '写真家志望', stars: 5, text: '夕暮れの京都×謎解きという組み合わせが天才的。写真を手がかりに街を巡るのが楽しすぎて時間を忘れました。', date: '2026-02-22', likeCount: 11 },
    { id: 602, user: '初めての謎解き', stars: 5, text: '謎解き初心者でも楽しめました。難易度が低めなので入門にぴったり。景色も最高です。', date: '2026-02-14', likeCount: 8 },
    { id: 603, user: '八坂の住人', stars: 4, text: '地元民ですが、知らない路地や新しい発見があって新鮮でした。観光客にも地元民にもおすすめ。', date: '2026-01-30', likeCount: 4 },
  ],
  7: [
    { id: 701, user: 'レトロゲーマー', stars: 5, text: 'ロックマン世代にはたまらない！商店街の音に8bitの記憶が重なって、めちゃくちゃエモかった。CDも最高。', date: '2026-03-01', likeCount: 18 },
    { id: 702, user: '音楽好きママ', stars: 5, text: '子供と一緒に参加。ゲーム知らなくても音探しが楽しい。おかんPのサイン入りCDは家宝にします。', date: '2026-02-28', likeCount: 14 },
    { id: 703, user: '大阪観光で来た', stars: 4, text: '商店街のおっちゃんおばちゃんも協力してくれて、大阪の温かさを感じた。地元感あって良い！', date: '2026-02-20', likeCount: 9 },
  ],
};

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  startOpeningTimer();
  await loadQuests();
  await initShopify();
  await checkAuth();
  renderHome();
});

/* ── DATA LOADING ── */
async function loadQuests() {
  // 商品データは常にフォールバック（コード内データ）を使用
  // Supabaseは認証・レビュー・お問い合わせ用
  allQuests = FALLBACK_QUESTS;
  reviewsByQuest = FALLBACK_REVIEWS;

  // DBにレビューがあればそちらを優先
  try {
    if (!db) return;
    const { data: revData } = await db.from('reviews')
      .select('*, profiles(display_name), review_likes(count)')
      .order('created_at', { ascending: false });
    if (revData && revData.length > 0) {
      reviewsByQuest = {};
      revData.forEach(r => {
        if (!reviewsByQuest[r.quest_id]) reviewsByQuest[r.quest_id] = [];
        reviewsByQuest[r.quest_id].push({
          id: r.id,
          user: r.profiles?.display_name || '匿名',
          stars: r.rating,
          text: r.text,
          date: new Date(r.created_at).toLocaleDateString('ja-JP'),
          likeCount: r.review_likes?.[0]?.count || 0,
        });
      });
    }
  } catch (e) {
    console.warn('Review load failed:', e.message);
  }
}

/* ── AUTH ── */
async function checkAuth() {
  if (!db) return;
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      userState.loggedIn = true;
      userState.userId = session.user.id;
      userState.email = session.user.email;
      userState.name = session.user.user_metadata?.display_name || session.user.email.split('@')[0];
      userState.avatar = userState.name.charAt(0);
      // Load accepted quests (cart + purchased)
      const { data } = await db.from('accepted_quests')
        .select('quest_id, status')
        .eq('user_id', session.user.id);
      if (data) {
        userState.acceptedQuests = data.map(d => d.quest_id);
        userState.purchasedQuests = data.filter(d => d.status === 'purchased').map(d => d.quest_id);
      }
      // Load favorites
      const { data: favData } = await db.from('favorites')
        .select('quest_id')
        .eq('user_id', session.user.id);
      if (favData) userFavorites = new Set(favData.map(f => f.quest_id));
    }
  } catch (e) { console.warn('Auth check failed:', e); }
}

let authMode = 'login';
let userFavorites = new Set();

function handleUserClick() {
  if (userState.loggedIn) {
    navigateTo('mypage');
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  authMode = 'login';
  updateAuthUI();
  document.getElementById('auth-modal').style.display = '';
}

function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

function toggleAuthMode(e) {
  e.preventDefault();
  authMode = authMode === 'login' ? 'signup' : 'login';
  updateAuthUI();
}

function updateAuthUI() {
  const isLogin = authMode === 'login';
  document.getElementById('auth-modal-title').textContent = isLogin ? 'ログイン' : '新規登録';
  document.getElementById('auth-name-group').style.display = isLogin ? 'none' : '';
  document.getElementById('auth-submit-btn').textContent = isLogin ? 'ログイン' : '新規登録';
  document.getElementById('auth-switch-text').textContent = isLogin ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は';
  document.getElementById('auth-switch-link').textContent = isLogin ? '新規登録' : 'ログイン';
  document.getElementById('auth-forgot').style.display = isLogin ? '' : 'none';
  document.getElementById('auth-form').style.display = '';
  document.getElementById('reset-form').style.display = 'none';
}

/* ── PASSWORD RESET ── */
function openPasswordReset(e) {
  e.preventDefault();
  document.getElementById('auth-form').style.display = 'none';
  document.getElementById('reset-form').style.display = '';
  document.getElementById('auth-modal-title').textContent = 'パスワードリセット';
}

function closePasswordReset(e) {
  e.preventDefault();
  document.getElementById('auth-form').style.display = '';
  document.getElementById('reset-form').style.display = 'none';
  document.getElementById('auth-modal-title').textContent = 'ログイン';
}

async function handlePasswordReset(e) {
  e.preventDefault();
  if (!db) { showToast('データベースに接続できません'); return; }
  const email = document.getElementById('reset-email').value;
  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?page=reset-password',
    });
    if (error) throw error;
    showToast('リセットメールを送信しました。メールをご確認ください。');
    closeAuthModal();
  } catch (err) {
    showToast(err.message || 'エラーが発生しました');
  }
}

async function handleAuth(e) {
  e.preventDefault();
  if (!db) { showToast('データベースに接続できません'); return; }

  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  try {
    if (authMode === 'signup') {
      const name = document.getElementById('auth-name').value || email.split('@')[0];
      const { data, error } = await db.auth.signUp({
        email, password,
        options: { data: { display_name: name } }
      });
      if (error) throw error;
      showToast('確認メールを送信しました。メールをご確認ください。');
    } else {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      userState.loggedIn = true;
      userState.userId = data.user.id;
      userState.email = data.user.email;
      userState.name = data.user.user_metadata?.display_name || email.split('@')[0];
      userState.avatar = userState.name.charAt(0);
      showToast(`ようこそ、${userState.name}さん`);
      closeAuthModal();
      renderHome();
    }
  } catch (err) {
    const msg = err.message || '';
    const ja =
      msg.includes('already registered') ? 'このメールアドレスは既に登録されています' :
      msg.includes('Invalid login') ? 'メールアドレスまたはパスワードが正しくありません' :
      msg.includes('Email rate limit') ? 'しばらく時間をおいてからお試しください' :
      msg.includes('valid password') ? 'パスワードは6文字以上で入力してください' :
      msg.includes('valid email') ? '正しいメールアドレスを入力してください' :
      'エラーが発生しました';
    showToast(ja);
  }
}

async function logout() {
  if (db) await db.auth.signOut();
  Object.assign(userState, { loggedIn: false, userId: null, name: '', email: '', avatar: '', acceptedQuests: [], purchasedQuests: [] });
  showToast('ログアウトしました');
  navigateTo('main');
  renderHome();
}

/* ── NAVIGATION ── */
function navigateTo(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
    currentPage = pageId;
  }

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Render page-specific content
  if (pageId === 'main') renderHome();
  if (pageId === 'mypage') renderMyPage();
  if (pageId === 'news') renderNews();
}

let openingTimer = null;

function enterSite() {
  if (openingTimer) clearTimeout(openingTimer);
  const opening = document.getElementById('page-opening');
  opening.classList.add('fade-out');
  setTimeout(() => navigateTo('main'), 450);
}

// Auto-transition after 3.5s (enough for animations to complete)
function startOpeningTimer() {
  openingTimer = setTimeout(enterSite, 2400);
}

/* ── RENDER: HOME ── */
function renderHome() {
  const filtered = currentCategory === 'all'
    ? allQuests
    : allQuests.filter(q => q.genre === currentCategory);

  const newQuests = filtered.filter(q => q.isNew).length > 0
    ? filtered.filter(q => q.isNew) : filtered.slice(0, 4);
  const popular = [...filtered].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);

  renderQuestGrid('new-quests-grid', newQuests);
  renderQuestGrid('popular-quests-grid', popular);
}

function renderQuestGrid(containerId, quests) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const isPopular = containerId === 'popular-quests-grid';

  container.innerHTML = quests.map((q, i) => `
    <div class="quest-card" onclick="openDetail(${q.id})">
      <div class="quest-card-thumb-wrap">
                <img class="quest-card-thumb" src="${q.image}" alt="${q.title}" loading="lazy"
             onerror="this.src='images/quest-1-new.webp'">
        ${userState.loggedIn ? `<button class="fav-btn ${userFavorites.has(q.id) ? 'active' : ''}"
          onclick="event.stopPropagation(); toggleFavorite(${q.id}, this)"
          title="お気に入り">${userFavorites.has(q.id) ? '♥' : '♡'}</button>` : ''}
      </div>
      <div class="quest-card-body">
        <div class="quest-card-title">${q.title}</div>
        <div class="quest-card-price">${q.price === 0 ? '無料' : '¥' + q.price.toLocaleString()}</div>
        <div class="quest-card-meta">
          <span class="quest-card-genre">${q.genre}</span>
          ${q.reviewCount > 0 ? `<span class="quest-card-rating">${'★'.repeat(Math.round(q.reviewAvg))}${'☆'.repeat(5 - Math.round(q.reviewAvg))} (${q.reviewCount})</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/* ── CATEGORY FILTER ── */
function filterByCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderHome();
}

/* ── SEARCH ── */
function openSearch() {
  document.getElementById('search-overlay').style.display = '';
  document.getElementById('search-input').focus();
}
function closeSearch() {
  document.getElementById('search-overlay').style.display = 'none';
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('search-input').value = '';
}
function handleSearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  if (!query) {
    document.getElementById('search-results').style.display = 'none';
    return;
  }
  const results = allQuests.filter(q =>
    q.title.toLowerCase().includes(query) ||
    q.genre.toLowerCase().includes(query) ||
    (q.subGenre && q.subGenre.toLowerCase().includes(query))
  );
  document.getElementById('search-results').style.display = '';
  renderQuestGrid('search-grid', results);
}

/* ── RENDER: DETAIL ── */
function openDetail(questId) {
  const quest = allQuests.find(q => q.id === questId);
  if (!quest) return;
  renderDetail(quest);
  navigateTo('detail');
}

function renderDetail(quest) {
  const reviews = reviewsByQuest[quest.id] || [];
  const isAccepted = userState.acceptedQuests.includes(quest.id);
  const isPurchased = userState.purchasedQuests.includes(quest.id);
  const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-hero">
      <img class="detail-hero-img" src="${quest.image}" alt="${quest.title}"
           onerror="this.src='images/quest-1-new.webp'">
      <div class="detail-hero-overlay">
        <h1 class="detail-hero-title">${quest.title}</h1>
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-story">${quest.prologue || quest.tagline}</div>

      <div class="spec-grid">
        <div class="spec-item">
          <div class="spec-label">制作者</div>
          <div class="spec-value">${quest.creatorName || 'REALQUEST'}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">ジャンル</div>
          <div class="spec-value">${quest.genre}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">推奨プレイ人数</div>
          <div class="spec-value">${quest.players}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">想定プレイ時間</div>
          <div class="spec-value">${quest.estimatedTime}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">難易度</div>
          <div class="spec-value">${stars(quest.difficulty)}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">形式</div>
          <div class="spec-value">${quest.format === 'home' ? '自宅完結' : quest.format === 'outdoor' ? 'フィールド探索' : quest.format}</div>
        </div>
      </div>

      <button class="btn-purchase" onclick="acceptQuest(${quest.id})">
        ${quest.price === 0 ? '▶ プレイ開始' : isAccepted ? `¥${quest.price.toLocaleString()} もう1つ追加する` : `¥${quest.price.toLocaleString()} で購入する`}
      </button>

      ${quest.items && quest.items.length > 0 ? `
        <div class="detail-section" style="margin-top:1.5rem">
          <div class="detail-section-header">同梱物</div>
          <div class="detail-section-body">
            <ul>${quest.items.map(i => `<li>${i.icon || '◆'} ${i.name}</li>`).join('')}</ul>
          </div>
        </div>
      ` : ''}

      ${quest.cautions && quest.cautions.length > 0 ? `
        <div class="detail-section">
          <div class="detail-section-header">注意事項</div>
          <div class="detail-section-body">
            <ul>${quest.cautions.map(c => `<li>${c}</li>`).join('')}</ul>
          </div>
        </div>
      ` : ''}

      <div class="detail-section">
        <div class="detail-section-header">ネタバレ/配信について</div>
        <div class="detail-section-body">
          <p>ネタバレ配信大歓迎です。ぜひSNSで感想を投稿してください。</p>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-header">お問い合わせ先</div>
        <div class="creator-contact">
          ${quest.creatorSns ? `<p>X (Twitter): <a href="https://twitter.com/${quest.creatorSns.replace('@','')}" target="_blank">${quest.creatorSns}</a></p>` : ''}
          <p>Email: <a href="mailto:${quest.creatorSns ? quest.creatorSns.replace('@','') + '.nazo@gmail.com' : 'info@c-ill.com'}">${quest.creatorSns ? quest.creatorSns.replace('@','') + '.nazo@gmail.com' : 'info@c-ill.com'}</a></p>
        </div>
      </div>


      <div class="detail-reviews">
        <h3>レビュー ${reviews.length > 0 ? `(${reviews.length}件)` : ''}</h3>
        ${isPurchased
          ? `<form class="review-form" onsubmit="submitReview(event, ${quest.id})">
            <div class="review-form-stars">
              <span class="review-form-label">評価</span>
              <div class="star-select" id="star-select">
                ${[1,2,3,4,5].map(n => `<span class="star-btn" data-star="${n}" onclick="selectStar(${n})">☆</span>`).join('')}
              </div>
              <input type="hidden" id="review-stars" value="0">
            </div>
            <textarea id="review-text" class="review-textarea" placeholder="感想を書いてください（任意）" rows="3"></textarea>
            <button type="submit" class="btn-primary" style="margin-top:0.5rem">レビューを投稿</button>
          </form>`
          : ''
        }
        ${reviews.length > 0 ? reviews.map(r => `
          <div class="review-card">
            <div class="review-header">
              <span class="review-user">${r.user}</span>
              <span class="review-stars">${stars(r.stars)}</span>
            </div>
            <div class="review-text">${r.text}</div>
            <div class="review-footer">
              <span class="review-date">${r.date}</span>
              ${r.id ? `<button class="review-like-btn" data-count="${r.likeCount || 0}" onclick="likeReview(${r.id}, this)">参考になった (${r.likeCount || 0})</button>
              ${userState.loggedIn ? `<button class="review-report-btn" onclick="openReportModal(${quest.id}, ${r.id})">通報</button>` : ''}` : ''}
            </div>
          </div>
        `).join('') : '<p class="empty-state" style="margin-top:1rem">まだレビューはありません</p>'}
      </div>
    </div>
  `;
}

/* ── ACCEPT / CART ── */
async function acceptQuest(questId) {
  const quest = allQuests.find(q => q.id === questId);
  if (!quest) return;

  // Add to local state (複数追加OK)
  userState.acceptedQuests.push(questId);

  // Re-render detail
  renderDetail(quest);
  updateCartBadge();
  showToast(`「${quest.title}」をカートに追加しました`);

  // Add to Shopify cart
  try {
    if (shopifyClient && shopifyCheckout) {
      const variantId = RQ_CONFIG.SHOPIFY_VARIANT_MAP?.[questId];
      if (variantId) {
        shopifyCheckout = await shopifyClient.checkout.addLineItems(shopifyCheckout.id, [{
          variantId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: 1,
        }]);
        updateCartBadge();
      }
    }
  } catch (e) { console.warn('Shopify cart add failed:', e); }

  // Save to Supabase
  try {
    if (db && userState.userId) {
      await db.from('accepted_quests').upsert({
        user_id: userState.userId,
        quest_id: questId,
        status: 'in_cart',
      }, { onConflict: 'user_id,quest_id' });
    }
  } catch (e) { console.warn('DB save failed:', e); }
}

function updateCartBadge() {
  let count = 0;
  if (shopifyCheckout?.lineItems?.length > 0) {
    count = shopifyCheckout.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  } else {
    count = userState.acceptedQuests.length;
  }
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  });
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
}

function renderCartDrawer() {
  const shopifyItems = shopifyCheckout?.lineItems || [];
  const cartItemsEl = document.getElementById('cart-items');
  const cartFooterEl = document.getElementById('cart-footer');

  // Shopifyが使える場合はShopifyのカートを表示
  if (shopifyItems.length > 0) {
    cartItemsEl.innerHTML = shopifyItems.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.variant?.image?.src || 'images/quest-1-new.webp'}" alt="">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">¥${parseInt(item.variant?.price?.amount || 0).toLocaleString()}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateQty('${item.id}', ${item.quantity - 1})">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-delete" onclick="removeFromCart('${item.id}')" aria-label="削除">🗑</button>
      </div>
    `).join('');
    const total = shopifyCheckout.totalPrice?.amount || '0';
    cartFooterEl.innerHTML = `
      <div class="cart-total">
        <span>合計</span>
        <span>¥${parseInt(total).toLocaleString()}</span>
      </div>
      <button class="cart-checkout" onclick="goToCheckout()">決済へ進む</button>
    `;
    return;
  }

  // Shopifyが使えない場合はローカルのacceptedQuestsから表示
  const localItems = userState.acceptedQuests.map(id => allQuests.find(q => q.id === id)).filter(Boolean);
  if (localItems.length === 0) {
    cartItemsEl.innerHTML = '<p class="empty-state">カートは空です</p>';
    cartFooterEl.innerHTML = '';
    return;
  }

  // 数量をカウント
  const qtyMap = {};
  userState.acceptedQuests.forEach(id => { qtyMap[id] = (qtyMap[id] || 0) + 1; });
  const uniqueItems = [...new Set(userState.acceptedQuests)].map(id => allQuests.find(q => q.id === id)).filter(Boolean);

  cartItemsEl.innerHTML = uniqueItems.map(q => `
    <div class="cart-item">
      <img class="cart-item-img" src="${q.image}" alt="${q.title}">
      <div class="cart-item-info">
        <div class="cart-item-title">${q.title}</div>
        <div class="cart-item-price">${q.price === 0 ? '無料' : '¥' + q.price.toLocaleString()}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateLocalQty(${q.id}, -1)">−</button>
          <span class="qty-value">${qtyMap[q.id]}</span>
          <button class="qty-btn" onclick="updateLocalQty(${q.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-delete" onclick="removeFromCartLocal(${q.id})" aria-label="削除">🗑</button>
    </div>
  `).join('');

  const total = uniqueItems.reduce((sum, q) => sum + q.price * qtyMap[q.id], 0);
  cartFooterEl.innerHTML = `
    <div class="cart-total">
      <span>合計</span>
      <span>¥${total.toLocaleString()}</span>
    </div>
    <button class="cart-checkout" onclick="goToCheckout()">決済へ進む</button>
  `;
}

function removeFromCartLocal(questId) {
  userState.acceptedQuests = userState.acceptedQuests.filter(id => id !== questId);
  updateCartBadge();
  renderCartDrawer();
}

function updateLocalQty(questId, delta) {
  if (delta > 0) {
    userState.acceptedQuests.push(questId);
  } else {
    const idx = userState.acceptedQuests.indexOf(questId);
    if (idx !== -1) userState.acceptedQuests.splice(idx, 1);
  }
  if (!userState.acceptedQuests.includes(questId)) {
    removeFromCartLocal(questId);
    return;
  }
  updateCartBadge();
  renderCartDrawer();
}

async function updateQty(lineItemId, newQty) {
  try {
    if (!shopifyClient || !shopifyCheckout) return;
    if (newQty <= 0) {
      await removeFromCart(lineItemId);
      return;
    }
    shopifyCheckout = await shopifyClient.checkout.updateLineItems(shopifyCheckout.id, [{
      id: lineItemId,
      quantity: newQty,
    }]);
    updateCartBadge();
    renderCartDrawer();
  } catch (e) { console.warn('Qty update failed:', e); }
}

async function removeFromCart(lineItemId) {
  try {
    if (shopifyClient && shopifyCheckout) {
      shopifyCheckout = await shopifyClient.checkout.removeLineItems(shopifyCheckout.id, [lineItemId]);
      updateCartBadge();
      renderCartDrawer();
    }
  } catch (e) { console.warn('Remove failed:', e); }
}

function goToCheckout() {
  if (shopifyCheckout?.webUrl) {
    window.open(shopifyCheckout.webUrl, '_blank');
  }
}

async function markCartAsPurchased() {
  // カート内の商品を購入済みに更新
  const cartQuestIds = userState.acceptedQuests.filter(id => !userState.purchasedQuests.includes(id));
  if (cartQuestIds.length === 0) return;

  cartQuestIds.forEach(id => {
    if (!userState.purchasedQuests.includes(id)) userState.purchasedQuests.push(id);
  });

  try {
    if (db && userState.userId) {
      for (const questId of cartQuestIds) {
        await db.from('accepted_quests').upsert({
          user_id: userState.userId,
          quest_id: questId,
          status: 'purchased',
        }, { onConflict: 'user_id,quest_id' });
      }
    }
  } catch (e) { console.warn('Purchase status update failed:', e); }

  showToast('ご購入ありがとうございます！');
}

/* ── RENDER: MY PAGE ── */
function renderMyPage() {
  const el = document.getElementById('mypage-content');
  if (!userState.loggedIn) {
    el.innerHTML = '<p class="empty-state">ログインしてマイページを表示しましょう。</p><button class="btn-primary" onclick="openAuthModal()" style="margin-top:1rem">ログイン</button>';
    return;
  }

  const purchased = allQuests.filter(q => userState.purchasedQuests.includes(q.id));
  const favQuests = allQuests.filter(q => userFavorites.has(q.id));

  el.innerHTML = `
    <div class="mypage-header">
      <div class="mypage-avatar">${userState.avatar}</div>
      <div>
        <div class="mypage-name">${userState.name}</div>
        <div class="mypage-email">${userState.email}</div>
      </div>
    </div>
    <div class="mypage-section">
      <h3>お気に入り (${favQuests.length})</h3>
      ${favQuests.length > 0 ? favQuests.map(q => `
        <div class="cart-item" onclick="openDetail(${q.id})" style="cursor:pointer">
          <img class="cart-item-img" src="${q.image}" alt="${q.title}">
          <div class="cart-item-info">
            <div class="cart-item-title">${q.title}</div>
            <div class="cart-item-price">¥${q.price.toLocaleString()}</div>
          </div>
        </div>
      `).join('') : '<p class="empty-state">お気に入りはまだありません</p>'}
    </div>
    <div class="mypage-section">
      <h3>購入した商品 (${purchased.length})</h3>
      ${purchased.length > 0 ? purchased.map(q => {
        const myReview = (reviewsByQuest[q.id] || []).find(r => r.user === userState.name);
        return `
        <div class="cart-item" style="cursor:pointer">
          <img class="cart-item-img" src="${q.image}" alt="${q.title}" onclick="openDetail(${q.id})">
          <div class="cart-item-info" onclick="openDetail(${q.id})">
            <div class="cart-item-title">${q.title}</div>
            <div class="cart-item-price">¥${q.price.toLocaleString()}</div>
          </div>
          <button class="btn-review-link" onclick="openDetail(${q.id})">
            ${myReview ? '✏️ レビュー済み' : '📝 レビューを書く'}
          </button>
        </div>`;
      }).join('') : '<p class="empty-state">購入した商品はまだありません</p>'}
    </div>
    <button class="mypage-logout" onclick="logout()">ログアウト</button>
  `;
}

/* ── RENDER: NEWS ── */
async function renderNews() {
  const el = document.getElementById('news-list');
  try {
    const res = await fetch(
      `https://${RQ_CONFIG.MICROCMS_DOMAIN}.microcms.io/api/v1/news?limit=20`,
      { headers: { 'X-MICROCMS-API-KEY': RQ_CONFIG.MICROCMS_API_KEY } }
    );
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    const items = json.contents || [];
    if (items.length === 0) {
      el.innerHTML = '<p class="empty-state">お知らせはまだありません。</p>';
      return;
    }
    el.innerHTML = items.map(n => `
      <div class="news-item">
        <span class="news-date">${new Date(n.publishedAt || n.createdAt).toLocaleDateString('ja-JP')}</span>
        ${n.category ? `<span class="news-category">${n.category.name || n.category}</span>` : ''}
        <div class="news-title">${n.title}</div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('News fetch failed:', e);
    el.innerHTML = '<p class="empty-state">お知らせはまだありません。</p>';
  }
}

/* ── CONTACT ── */
async function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const type = document.getElementById('contact-type').value;
  const message = document.getElementById('contact-message').value;

  try {
    if (db) {
      const { error } = await db.from('contact_submissions').insert({
        name, email, category: type, message,
      });
      if (error) throw error;
    }
    showToast('送信しました。ありがとうございます。');
    document.getElementById('contact-form').reset();
  } catch (err) {
    console.error('Contact submit error:', err);
    showToast('送信に失敗しました。時間をおいて再度お試しください。');
  }
}

/* ── REVIEWS ── */
function selectStar(n) {
  document.getElementById('review-stars').value = n;
  document.querySelectorAll('#star-select .star-btn').forEach(btn => {
    const val = parseInt(btn.dataset.star);
    btn.textContent = val <= n ? '★' : '☆';
    btn.classList.toggle('selected', val <= n);
  });
}

async function submitReview(e, questId) {
  e.preventDefault();
  const starsVal = parseInt(document.getElementById('review-stars').value);
  const text = document.getElementById('review-text').value.trim();

  if (!starsVal || starsVal < 1) {
    showToast('星の数を選択してください');
    return;
  }
  if (!userState.loggedIn || !db) {
    showToast('ログインが必要です');
    return;
  }
  if (!userState.purchasedQuests.includes(questId)) {
    showToast('レビューは購入者のみ投稿できます');
    return;
  }

  try {
    const { error } = await db.from('reviews').upsert({
      user_id: userState.userId,
      quest_id: questId,
      rating: starsVal,
      text: text,
    }, { onConflict: 'user_id,quest_id' });
    if (error) throw error;

    showToast('レビューを投稿しました');

    // Update local review data
    if (!reviewsByQuest[questId]) reviewsByQuest[questId] = [];
    const existing = reviewsByQuest[questId].findIndex(r => r.user === userState.name);
    const reviewEntry = {
      user: userState.name,
      stars: starsVal,
      text: text,
      date: new Date().toLocaleDateString('ja-JP'),
    };
    if (existing >= 0) {
      reviewsByQuest[questId][existing] = reviewEntry;
    } else {
      reviewsByQuest[questId].unshift(reviewEntry);
    }

    // Re-render detail
    const quest = allQuests.find(q => q.id === questId);
    if (quest) renderDetail(quest);
  } catch (err) {
    console.error('Review submit error:', err);
    showToast(err.message || 'レビューの投稿に失敗しました');
  }
}

/* ── FAVORITES ── */
async function toggleFavorite(questId, btnEl) {
  if (!userState.loggedIn || !db) { showToast('ログインが必要です'); return; }
  const isFav = userFavorites.has(questId);
  try {
    if (isFav) {
      await db.from('favorites').delete().eq('user_id', userState.userId).eq('quest_id', questId);
      userFavorites.delete(questId);
      if (btnEl) { btnEl.textContent = '♡'; btnEl.classList.remove('active'); }
      showToast('お気に入りから削除しました');
    } else {
      await db.from('favorites').insert({ user_id: userState.userId, quest_id: questId });
      userFavorites.add(questId);
      if (btnEl) { btnEl.textContent = '♥'; btnEl.classList.add('active'); }
      showToast('お気に入りに追加しました');
    }
  } catch (e) {
    console.error('Favorite toggle error:', e);
    showToast('操作に失敗しました');
  }
}

/* ── REPORT ── */
function openReportModal(questId, reviewId) {
  document.getElementById('report-quest-id').value = questId || '';
  document.getElementById('report-review-id').value = reviewId || '';
  document.getElementById('report-modal').style.display = '';
}
function closeReportModal() {
  document.getElementById('report-modal').style.display = 'none';
}

async function submitReport(e) {
  e.preventDefault();
  if (!db) { showToast('データベースに接続できません'); return; }
  const questId = document.getElementById('report-quest-id').value;
  const reviewId = document.getElementById('report-review-id').value;
  const reason = document.getElementById('report-reason').value;
  const detail = document.getElementById('report-detail').value;

  if (!reason) { showToast('通報理由を選択してください'); return; }

  try {
    const { error } = await db.from('reports').insert({
      user_id: userState.userId || null,
      quest_id: questId ? parseInt(questId) : null,
      review_id: reviewId ? parseInt(reviewId) : null,
      reason, detail,
    });
    if (error) throw error;
    showToast('通報を受け付けました。ご報告ありがとうございます。');
    closeReportModal();
  } catch (err) {
    console.error('Report error:', err);
    showToast('送信に失敗しました');
  }
}

/* ── REVIEW LIKES ── */
async function likeReview(reviewId, btnEl) {
  if (!userState.loggedIn || !db) { showToast('ログインが必要です'); return; }
  try {
    // Check if already liked
    const { data: existing } = await db.from('review_likes')
      .select('id')
      .eq('user_id', userState.userId)
      .eq('review_id', reviewId)
      .maybeSingle();

    if (existing) {
      await db.from('review_likes').delete().eq('id', existing.id);
      if (btnEl) {
        const count = parseInt(btnEl.dataset.count) - 1;
        btnEl.dataset.count = count;
        btnEl.textContent = `参考になった (${count})`;
        btnEl.classList.remove('liked');
      }
    } else {
      await db.from('review_likes').insert({ user_id: userState.userId, review_id: reviewId });
      if (btnEl) {
        const count = parseInt(btnEl.dataset.count) + 1;
        btnEl.dataset.count = count;
        btnEl.textContent = `参考になった (${count})`;
        btnEl.classList.add('liked');
      }
    }
  } catch (e) {
    console.error('Like error:', e);
    showToast('操作に失敗しました');
  }
}

/* ── MOBILE MENU ── */
function openMobileMenu() {
  document.getElementById('mobile-menu').classList.add('open');
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
}

/* ── TOAST ── */
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}
