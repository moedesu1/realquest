/* ============================================================
   REAL QUEST — App v2 + Production Integration
   Original Design + Supabase Auth/DB + Shopify Cart
   ============================================================ */

/* ── SUPABASE CLIENT ── */
let db = null;
try {
  if (typeof window.supabase !== 'undefined' && RQ_CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    db = window.supabase.createClient(RQ_CONFIG.SUPABASE_URL, RQ_CONFIG.SUPABASE_ANON_KEY);
  }
} catch (e) { /* SDK not loaded or config not set */ }

/* ── SHOPIFY CLIENT ── */
let shopifyClient = null;
let shopifyCheckout = null;

async function initShopify() {
  try {
    if (typeof ShopifyBuy === 'undefined' || RQ_CONFIG.SHOPIFY_DOMAIN === 'YOUR_STORE.myshopify.com') return;
    shopifyClient = ShopifyBuy.buildClient({
      domain: RQ_CONFIG.SHOPIFY_DOMAIN,
      storefrontAccessToken: RQ_CONFIG.SHOPIFY_STOREFRONT_TOKEN,
    });
    const savedCheckoutId = localStorage.getItem('rq_checkout_id');
    if (savedCheckoutId) {
      try {
        shopifyCheckout = await shopifyClient.checkout.fetch(savedCheckoutId);
        if (shopifyCheckout.completedAt) { shopifyCheckout = await shopifyClient.checkout.create(); localStorage.setItem('rq_checkout_id', shopifyCheckout.id); }
      } catch { shopifyCheckout = await shopifyClient.checkout.create(); localStorage.setItem('rq_checkout_id', shopifyCheckout.id); }
    } else {
      shopifyCheckout = await shopifyClient.checkout.create();
      localStorage.setItem('rq_checkout_id', shopifyCheckout.id);
    }
    updateCartBadge();
  } catch (e) { console.warn('Shopify init skipped:', e.message); }
}

/* ── GA4 TRACKING ── */
function trackEvent(name, params = {}) {
  if (typeof gtag === 'function') gtag('event', name, params);
}

/* ── TOAST NOTIFICATION ── */
let toastTimer = null;
function showToast(message, duration = 3000) {
  const el = document.getElementById('toast-notification');
  if (!el) return;
  el.textContent = message;
  el.classList.add('active');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('active'), duration);
}

/* ── SAFE SUPABASE CALL ── */
async function safeSupabaseCall(fn) {
  if (!db) {
    showToast('サービスに接続できません');
    return null;
  }
  if (!navigator.onLine) {
    showToast('ネットワークに接続されていません');
    return null;
  }
  try {
    return await fn();
  } catch (e) {
    showToast(e.message || 'エラーが発生しました');
    return null;
  }
}

/* ── QUEST DATA (fallback) ── */
const fallbackQuests = []; // populated below, used to restore reviews when DB has none
let quests = [
  {
    id: 1,
    title: '大阪怪奇事件ファイル',
    tagline: '未解決事件の真相が、あなたの手元に届く——',
    rank: 'B',
    difficulty: 2,
    price: 3000,
    category: 'beginner',
    format: 'home',
    genre: '推理',
    subGenre: 'ミステリー',
    isNew: true,
    image: 'images/quest-1-alchemy.webp',
    estimatedTime: '2〜4時間',
    players: '1〜3人',
    region: '自宅完結',
    items: [
      { icon: '◆', name: '捜査資料ファイル（証拠写真・調書入り）' },
      { icon: '◆', name: '謎の鍵（金属製）' },
      { icon: '◆', name: '捜査本部からの依頼書' },
    ],
    prologue: '大阪で起きた連続怪奇事件——目撃者の証言は矛盾だらけ、現場には説明のつかない痕跡が残されていた。捜査本部がギルドに依頼した資料一式があなたの元に届く。封筒の中の鍵は、何を開けるためのものなのか。真相は、証拠の中に隠されている。',
    cautions: ['ネタバレ禁止', '筆記用具をご用意ください', '対象年齢: 12歳以上'],
    purposes: ['puzzle', 'home'],
    reviews: [
      { user: '黒鉄の剣士', title: '冒険者', avatar: '黒', level: 28, rank: 'C', stars: 5, date: '2026.02.15', text: '捜査資料のリアルさに驚いた。証拠写真を並べて推理する過程が本格的で没入感がすごい。家族3人で挑んで3時間で解決。鍵のギミックが特に秀逸！', sub: { craft: 5, story: 4, volume: 4 }, likes: 12 },
      { user: '月影の魔女', title: '勇者', avatar: '月', level: 45, rank: 'B', stars: 4, date: '2026.02.10', text: '調書の作り込みが凝っていて感動。もう少しヒントがあると初心者にも優しいかも。最後の真相に辿り着いた時の達成感が最高でした。', sub: { craft: 5, story: 4, volume: 3 }, likes: 8 },
      { user: '旅の商人', title: '見習い', avatar: '旅', level: 12, rank: 'D', stars: 5, date: '2026.01.28', text: '友達3人でやって最高に盛り上がった。大阪が舞台なのもリアルで面白い。次のクエストも必ずやります。', sub: { craft: 4, story: 5, volume: 4 }, likes: 5 },
    ],
    reviewAvg: 4.7,
    reviewCount: 24,
    salesCount: 156,
  },
  {
    id: 2,
    title: '奈良・消えた鹿の暗号',
    tagline: '古都に眠る暗号が、あなたを導く——',
    rank: 'A',
    difficulty: 3,
    price: 3500,
    category: 'advanced',
    format: 'hybrid',
    genre: '暗号解読',
    subGenre: '歴史冒険',
    isNew: false,
    image: 'images/quest-2-library.webp',
    estimatedTime: '3〜5時間',
    players: '1〜4人',
    region: '奈良',
    items: [
      { icon: '◆', name: '古びた手紙（暗号入り）' },
      { icon: '◆', name: '木札（ヒント刻印入り）' },
      { icon: '◆', name: 'ギルドからの依頼書' },
    ],
    prologue: '奈良公園の鹿が一頭、忽然と姿を消した。ただの迷子ではない——その鹿は、千年前から受け継がれてきた「神鹿」だった。古びた手紙に記された暗号を解けば、消えた鹿の行方と、古都に隠された秘密に辿り着ける。',
    cautions: ['ネタバレ禁止', '現地ステージあり（奈良市内）', '歩きやすい服装推奨', '対象年齢: 12歳以上'],
    purposes: ['puzzle', 'outdoor'],
    reviews: [
      { user: '星読みの賢者', title: '冒険者', avatar: '星', level: 33, rank: 'C', stars: 5, date: '2026.02.12', text: '奈良の街を歩きながら暗号を解く体験は格別。木札のギミックが面白くて、観光としても楽しめる。歴史の知識が自然と身につくのもいい。', sub: { craft: 5, story: 5, volume: 3 }, likes: 15 },
      { user: '森の狩人', title: '見習い', avatar: '森', level: 8, rank: 'E', stars: 4, date: '2026.02.01', text: 'カップルでやったら最高。古びた手紙の質感がリアルで、開封する瞬間のドキドキ感がいい。初めてのリアクエだったけど、すっかりハマりました。', sub: { craft: 4, story: 5, volume: 3 }, likes: 7 },
    ],
    reviewAvg: 4.5,
    reviewCount: 18,
    salesCount: 112,
  },
  {
    id: 3,
    title: '古い携帯の未送信メッセージ',
    tagline: '10年前の想いが、今あなたの手元に——',
    rank: 'C',
    difficulty: 1,
    price: 2800,
    category: 'beginner',
    format: 'home',
    genre: '謎解き',
    subGenre: 'ヒューマンドラマ',
    isNew: true,
    image: 'images/quest-3-ruins.webp',
    estimatedTime: '1〜2時間',
    players: '1人',
    region: '自宅完結',
    items: [
      { icon: '◆', name: '古い携帯電話本体（ギミック内蔵）' },
      { icon: '◆', name: 'ギルドからの依頼書' },
    ],
    prologue: 'リサイクルショップで見つかった古い携帯電話。電源を入れると、下書きフォルダに未送信のメッセージが残されていた。誰が、誰に、何を伝えようとしていたのか——。携帯に残された手がかりから、10年前の想いを紐解け。',
    cautions: ['ネタバレ禁止', '対象年齢: 10歳以上'],
    purposes: ['puzzle', 'home'],
    reviews: [
      { user: '古代の探究者', title: '勇者', avatar: '古', level: 52, rank: 'B', stars: 5, date: '2026.02.20', text: '携帯電話が本物みたいで驚いた。メッセージを一つずつ読み解いていく過程に感動。最後のメッセージの内容に泣きました。', sub: { craft: 5, story: 5, volume: 2 }, likes: 23 },
    ],
    reviewAvg: 4.9,
    reviewCount: 31,
    salesCount: 89,
  },
  {
    id: 4,
    title: '失われた財布の秘密',
    tagline: '誰かの日常が、あなたの謎になる——',
    rank: 'B',
    difficulty: 2,
    price: 4000,
    category: 'beginner',
    format: 'home',
    genre: '推理',
    subGenre: 'リアルミステリー',
    isNew: false,
    image: 'images/quest-4-clocktower.webp',
    estimatedTime: '2〜3時間',
    players: '1〜2人',
    region: '自宅完結',
    items: [
      { icon: '◆', name: '誰かの財布（レシートや身分証入り）' },
      { icon: '◆', name: 'ギルドからの依頼書' },
    ],
    prologue: 'ギルドに届けられた落とし物——誰かの財布。中にはレシート、身分証、メモ、写真が入っている。持ち主を探すだけの簡単な依頼のはずだった。だが中身を調べるうちに、この財布が「落とされた」のではなく「残された」ものだと気づく。',
    cautions: ['ネタバレ禁止', '筆記用具をご用意ください', '対象年齢: 12歳以上'],
    purposes: ['puzzle', 'home'],
    reviews: [
      { user: '鉄壁の騎士', title: '冒険者', avatar: '鉄', level: 22, rank: 'D', stars: 4, date: '2026.01.25', text: 'レシートや身分証のリアルさに驚いた。推理していくうちにゾクッとする展開が待っていた。日常の中に潜む謎というコンセプトが新鮮。', sub: { craft: 4, story: 5, volume: 3 }, likes: 9 },
      { user: '風の吟遊詩人', title: '見習い', avatar: '風', level: 5, rank: 'E', stars: 5, date: '2026.01.18', text: 'リアルな小道具の作り込みが素晴らしい！レシートの日付や店名まで手がかりになっているのが面白い。推理好きには絶対おすすめ。', sub: { craft: 5, story: 5, volume: 3 }, likes: 6 },
    ],
    reviewAvg: 4.3,
    reviewCount: 15,
    salesCount: 78,
  },
  {
    id: 5,
    title: '闇オークションのボードゲーム',
    tagline: '招待されし者だけが、ゲームに参加できる——',
    rank: 'A',
    difficulty: 3,
    price: 4500,
    category: 'advanced',
    format: 'home',
    genre: '体験型',
    subGenre: 'ボードゲーム',
    isNew: true,
    image: 'images/quest-5-deepsea.webp',
    estimatedTime: '3〜5時間',
    players: '2〜5人',
    region: '自宅完結',
    items: [
      { icon: '◆', name: '招待状（封蝋付き）' },
      { icon: '◆', name: '専用ボードゲーム一式' },
      { icon: '◆', name: 'ギルド最高機密依頼書' },
    ],
    prologue: '届いたのは、封蝋で封じられた一通の招待状。「闇オークション」への参加権と、そこで使う専用ボードゲームが同封されていた。ゲームのルールは単純だが、裏には隠されたルールがある。全てのカードを読み解いた時、オークションの真の目的が明らかになる。',
    cautions: ['ネタバレ禁止', '2人以上での挑戦推奨', '対象年齢: 15歳以上'],
    purposes: ['boardgame', 'home'],
    reviews: [
      { user: '深淵の探索者', title: '賢者', avatar: '深', level: 78, rank: 'A', stars: 5, date: '2026.02.22', text: 'ボードゲームとしても謎解きとしても完成度が高い。5人でやったけど全員が役割を持てるバランスが素晴らしい。隠しルールを発見した時の衝撃がたまらない。', sub: { craft: 5, story: 5, volume: 5 }, likes: 31 },
      { user: '炎の魔術師', title: '勇者', avatar: '炎', level: 56, rank: 'B', stars: 5, date: '2026.02.18', text: '封蝋の招待状を開ける瞬間からテンション爆上がり。ボードゲーム部分も戦略性があって面白い。何度でも遊べるのもいい。', sub: { craft: 5, story: 5, volume: 5 }, likes: 19 },
      { user: '銀の盗賊', title: '冒険者', avatar: '銀', level: 31, rank: 'C', stars: 4, date: '2026.02.05', text: '招待状の演出が最高。ただ2人だと少し物足りない場面があったので、3人以上推奨。ゲーム自体のクオリティは文句なし。', sub: { craft: 5, story: 4, volume: 5 }, likes: 11 },
    ],
    reviewAvg: 4.8,
    reviewCount: 42,
    salesCount: 203,
  },
  {
    id: 6,
    title: '回復のポーション',
    tagline: 'ヒントと共に、冒険の活力を——',
    rank: 'C',
    difficulty: 0,
    price: 500,
    category: 'beginner',
    format: 'home',
    genre: '体験型',
    subGenre: '共通アイテム',
    isNew: false,
    image: 'images/quest-6-potionshop.webp',
    estimatedTime: '—',
    players: '—',
    region: '自宅完結',
    items: [
      { icon: '◆', name: 'リアクエ専用ドリンク' },
      { icon: '◆', name: 'ヒント解放コード付きカード' },
    ],
    prologue: '冒険に疲れた時、行き詰まった時——この「回復のポーション」があなたを助ける。リアクエ専用ドリンクと共に届くカードには、各クエストで使えるヒント解放コードが封入されている。飲んで、読んで、再び冒険へ。',
    cautions: ['賞味期限をご確認ください', '各クエストのヒントは1回限り'],
    purposes: ['home'],
    reviews: [
      { user: '白銀の聖女', title: '見習い', avatar: '白', level: 15, rank: 'D', stars: 5, date: '2026.02.08', text: 'ドリンクが意外と美味しい！ヒントコードのおかげで詰まっていたクエストをクリアできた。冒険のお供に最適。', sub: { craft: 4, story: 3, volume: 2 }, likes: 18 },
      { user: '大地の守人', title: '見習い', avatar: '大', level: 3, rank: 'F', stars: 4, date: '2026.01.30', text: 'ポーション瓶のデザインが可愛い。ヒントコードが思った以上に役立つ。気軽に買えるのがいい。', sub: { craft: 4, story: 3, volume: 2 }, likes: 10 },
    ],
    reviewAvg: 4.6,
    reviewCount: 35,
    salesCount: 267,
  },
];

// Save fallback reviews for when DB has no reviews
quests.forEach(q => fallbackQuests.push({ id: q.id, reviews: q.reviews }));

/* ── USER STATE ── */
const userState = {
  loggedIn: false,
  role: null,
  name: '名もなき冒険者',
  avatar: '冒',
  title: '見習い',
  questsAccepted: 0,
  coins: 0,
  acceptedQuests: [],
  favorites: [],
};

/* Title progression */
const titleLevels = [
  { name: '見習い', min: 0 },
  { name: '冒険者', min: 2 },
  { name: '勇者', min: 5 },
  { name: '賢者', min: 10 },
];

/* ── NAVIGATION ── */
let currentPage = 'opening';
let savedScrollPositions = {};

function navigateTo(pageId, options = {}) {
  const pageMap = {
    'opening': 'page-opening',
    'quest-board': 'page-quest-board',
    'detail': 'page-detail',
    'rankings': 'page-rankings',
    'mypage': 'page-mypage',
    'creator': 'page-creator',
    'guide': 'page-guide',
    'reviews': 'page-reviews',
    'coin-shop': 'page-coin-shop',
    'news': 'page-news',
    'campaigns': 'page-campaigns',
    'contact': 'page-contact',
    'terms': 'page-terms',
    'privacy': 'page-privacy',
    'tokushoho': 'page-tokushoho',
  };

  const targetEl = pageMap[pageId];
  if (!targetEl) return;

  // Save current scroll
  const currentEl = document.querySelector('.page.active');
  if (currentEl) savedScrollPositions[currentEl.id] = currentEl.scrollTop;

  // Transition
  if (options.transition !== false) {
    const overlay = document.getElementById('transition-overlay');
    overlay.querySelector('.transition-text').textContent = options.transitionText || 'ページを読み込んでいます...';
    overlay.classList.add('active');

    setTimeout(() => {
      currentPage = pageId;
      showPage(targetEl);
      if (options.onShow) options.onShow();
      // Page-specific init
      if (pageId === 'quest-board') renderHomeBoard();
      if (pageId === 'rankings') renderRanking('popular');
      if (pageId === 'mypage') renderMyPage();
      if (pageId === 'guide') renderGuidePage();
      if (pageId === 'reviews') renderReviewsPage();
      if (pageId === 'coin-shop') renderCoinShopPage();
      if (pageId === 'news') renderNewsPage();
      if (pageId === 'campaigns') renderCampaignsPage();
      if (pageId === 'contact') renderContactPage();
      if (['terms', 'privacy', 'tokushoho'].includes(pageId)) renderLegalPage(pageId);
      setTimeout(() => overlay.classList.remove('active'), 400);
    }, options.delay || 600);
  } else {
    currentPage = pageId;
    showPage(targetEl);
    if (options.onShow) options.onShow();
    if (pageId === 'quest-board') renderHomeBoard();
    if (pageId === 'rankings') renderRanking('popular');
    if (pageId === 'mypage') renderMyPage();
    if (pageId === 'guide') renderGuidePage();
    if (pageId === 'reviews') renderReviewsPage();
    if (pageId === 'coin-shop') renderCoinShopPage();
    if (pageId === 'news') renderNewsPage();
    if (pageId === 'campaigns') renderCampaignsPage();
    if (pageId === 'contact') renderContactPage();
    if (['terms', 'privacy', 'tokushoho'].includes(pageId)) renderLegalPage(pageId);
  }

  trackEvent('page_view', { page_title: pageId });
}

function showPage(targetId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(targetId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = savedScrollPositions[targetId] || 0;
  }
  updateActiveNavLinks();
}

function updateActiveNavLinks() {
  // Map sub-pages to their parent nav link
  const navParent = { 'detail': 'quest-board', 'creator': 'quest-board' };
  const activePage = navParent[currentPage] || currentPage;
  // Update nav links on ALL pages (visible + hidden) so switching is instant
  document.querySelectorAll('.header-nav-link').forEach(link => {
    link.classList.remove('active');
    const page = link.getAttribute('onclick')?.match(/navigateTo\('(.+?)'\)/)?.[1];
    if (page === activePage) link.classList.add('active');
  });
}

/* ── AUTH ── */
let authMode = 'login';

function switchAuthTab(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach((tab, i) => {
    tab.classList.toggle('active', (i === 0 && mode === 'login') || (i === 1 && mode === 'signup'));
  });
  const nameField = document.getElementById('auth-name-field');
  const submitText = document.getElementById('auth-submit-text');
  const pwField = document.getElementById('auth-password');
  if (mode === 'signup') {
    nameField.style.display = 'block';
    submitText.textContent = '冒険者として登録';
    pwField.autocomplete = 'new-password';
  } else {
    nameField.style.display = 'none';
    submitText.textContent = '冒険者としてログイン';
    pwField.autocomplete = 'current-password';
  }
  document.getElementById('auth-error').textContent = '';
  // Hide reset form if visible
  document.getElementById('auth-reset-form').style.display = 'none';
  document.querySelector('.auth-form').style.display = '';
  document.querySelector('.auth-links').style.display = '';
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');
  errorEl.textContent = '';
  submitBtn.disabled = true;

  if (!db) {
    errorEl.style.color = 'var(--accent-red)';
    errorEl.textContent = 'サービスに接続できません。しばらくしてから再度お試しください。';
    submitBtn.disabled = false;
    return;
  }

  try {
    if (authMode === 'signup') {
      const displayName = document.getElementById('auth-name').value.trim() || '名もなき冒険者';
      const { data, error } = await db.auth.signUp({
        email, password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      if (data.user && !data.session) {
        errorEl.style.color = 'var(--neon-gold)';
        errorEl.textContent = '確認メールを送信しました。メールのリンクをクリックしてください。';
        submitBtn.disabled = false;
        return;
      }
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
    // Auth state change listener will handle navigation
  } catch (err) {
    errorEl.style.color = 'var(--accent-red)';
    const msg = err.message || '';
    if (msg.includes('Invalid login')) errorEl.textContent = 'メールアドレスまたはパスワードが正しくありません';
    else if (msg.includes('already registered')) errorEl.textContent = 'このメールアドレスは既に登録されています';
    else errorEl.textContent = msg || '認証エラーが発生しました';
  }
  submitBtn.disabled = false;
}

async function handleLogout() {
  if (db) await db.auth.signOut();
  userState.loggedIn = false;
  userState.role = null;
  userState.name = '名もなき冒険者';
  userState.avatar = '冒';
  userState.title = '見習い';
  userState.questsCompleted = 0;
  userState.questsAccepted = 0;
  userState.coins = 0;
  userState.acceptedQuests = [];
  navigateTo('opening', { transitionText: 'ログアウトしています...', delay: 600 });
}

function showPasswordReset() {
  document.querySelector('.auth-form').style.display = 'none';
  document.querySelector('.auth-links').style.display = 'none';
  document.getElementById('auth-reset-form').style.display = 'block';
}

function backToLogin() {
  document.querySelector('.auth-form').style.display = '';
  document.querySelector('.auth-links').style.display = '';
  document.getElementById('auth-reset-form').style.display = 'none';
}

function togglePwVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.querySelector('.pw-eye-open').style.display = isPassword ? 'none' : '';
  btn.querySelector('.pw-eye-closed').style.display = isPassword ? '' : 'none';
}

function switchToSignup() {
  const signupCard = document.getElementById('signup-form-card');
  const signupCta = document.querySelector('.mypage-signup-card');
  if (signupCard) { signupCard.style.display = 'block'; signupCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (signupCta) signupCta.style.display = 'none';
}

function switchToLogin() {
  const signupCard = document.getElementById('signup-form-card');
  const signupCta = document.querySelector('.mypage-signup-card');
  if (signupCard) signupCard.style.display = 'none';
  if (signupCta) signupCta.style.display = '';
  document.querySelector('.mypage-auth-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim() || '名もなき冒険者';
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errorEl = document.getElementById('signup-error');
  const submitBtn = document.getElementById('signup-submit-btn');
  errorEl.textContent = '';
  submitBtn.disabled = true;

  if (!db) {
    errorEl.style.color = 'var(--accent-red)';
    errorEl.textContent = 'サービスに接続できません';
    submitBtn.disabled = false;
    return;
  }

  try {
    const { data, error } = await db.auth.signUp({
      email, password,
      options: { data: { display_name: name } }
    });
    if (error) throw error;
    if (data.user && !data.session) {
      errorEl.style.color = 'var(--neon-gold)';
      errorEl.textContent = '確認メールを送信しました。メールのリンクをクリックしてください。';
      submitBtn.disabled = false;
      return;
    }
  } catch (err) {
    errorEl.style.color = 'var(--accent-red)';
    const msg = err.message || '';
    if (msg.includes('already registered')) errorEl.textContent = 'このメールアドレスは既に登録されています';
    else errorEl.textContent = msg || '登録エラーが発生しました';
  }
  submitBtn.disabled = false;
}

async function handlePasswordReset() {
  const email = document.getElementById('reset-email').value.trim();
  const errorEl = document.getElementById('reset-error');
  if (!email) { errorEl.textContent = 'メールアドレスを入力してください'; return; }
  if (!db) { errorEl.textContent = 'この機能は現在利用できません'; return; }
  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw error;
    errorEl.style.color = 'var(--neon-gold)';
    errorEl.textContent = 'リセットリンクを送信しました。メールを確認してください。';
  } catch (err) {
    errorEl.style.color = 'var(--accent-red)';
    errorEl.textContent = err.message || 'エラーが発生しました';
  }
}

async function loadUserProfile(userId) {
  if (!db) return;

  // Always read name from auth metadata first (reliable)
  try {
    const { data: { user } } = await db.auth.getUser();
    if (user?.user_metadata?.display_name) {
      userState.name = user.user_metadata.display_name;
    }
  } catch(e) {}

  // Then try profiles table (may not exist yet)
  try {
    const { data: profile, error } = await db.from('profiles').select('*').eq('id', userId).single();
    if (profile && !error) {
      if (profile.display_name) userState.name = profile.display_name;
      userState.avatar = profile.avatar_char || localStorage.getItem('rq_avatar') || '冒';
      userState.title = profile.title || '見習い';
      userState.questsCompleted = profile.quests_completed || 0;
      userState.questsAccepted = profile.quests_accepted || 0;
      userState.coins = profile.coins || 0;
    }
  } catch(e) {}

  try {
    const { data: accepted } = await db.from('accepted_quests').select('quest_id').eq('user_id', userId);
    if (accepted) userState.acceptedQuests = accepted.map(a => a.quest_id);
  } catch(e) {}
}

/* Supabase auth state listener */
if (db) {
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      userState.loggedIn = false;
      userState.role = null;
      userState.name = '名もなき冒険者';
      userState.avatar = '冒';
      userState.title = '見習い';
      userState.questsCompleted = 0;
      userState.questsAccepted = 0;
      userState.coins = 0;
      userState.acceptedQuests = [];
      navigateTo('opening', { transitionText: 'セッションが終了しました', delay: 600 });
      return;
    }
    if (event === 'PASSWORD_RECOVERY') {
      showToast('パスワードをリセットしてください');
      navigateTo('mypage');
      return;
    }
    if (session?.user) {
      userState.loggedIn = true;
      userState.role = 'adventurer';
      if (session.user.user_metadata?.display_name) {
        userState.name = session.user.user_metadata.display_name;
      }
      await loadUserProfile(session.user.id);
      updateHeaderUser();
      if (currentPage === 'opening' || currentPage === 'mypage') {
        playStartSFX();
        setTimeout(() => startBGM(), 300);
        navigateTo('quest-board', {
          transitionText: 'ギルド掲示板を開いています...',
          delay: 1200,
          onShow: () => { renderHomeBoard(); updateHeaderUser(); }
        });
      }
    }
  });

  // Handle email confirmation / password reset hash params
  (function handleAuthHash() {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
      // Supabase SDK handles this automatically via onAuthStateChange
      // Clean up URL
      history.replaceState(null, '', window.location.pathname);
    }
  })();
}

/* Login as adventurer — show auth form on mypage */
function loginAsAdventurer() {
  playStartSFX();
  setTimeout(() => startBGM(), 300);
  navigateTo('quest-board', {
    transitionText: 'クエストボードへ向かっています...',
    delay: 800,
  });
}

function loginAsCreator() {
  navigateTo('creator', {
    transitionText: '創造者ギルドを準備中...',
    delay: 800,
  });
}

function updateHeaderUser() {
  document.querySelectorAll('#header-username').forEach(el => el.textContent = userState.name);
  document.querySelectorAll('.header-username-sub').forEach(el => el.textContent = userState.name);
  document.querySelectorAll('#header-title').forEach(el => el.textContent = userState.title);
}

/* ── HOME QUEST CARD HTML HELPER ── */
function buildHomeQuestCardHtml(q) {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span class="star ${i < q.difficulty ? 'filled' : ''}">★</span>`
  ).join('');
  const formatLabel = { home: '自宅完結', outdoor: '現地型', hybrid: 'ハイブリッド' }[q.format] || q.format;

  return `
    <div class="home-quest-card" onclick="openQuestDetail(${q.id})">
      ${q.isNew ? '<div class="card-badge">NEW</div>' : ''}
      <div class="card-image">
        ${q.image ? `<img src="${q.image}" alt="${q.title}" loading="lazy">` : `<div style="width:100%;height:100%;background:var(--bg-panel)"></div>`}
      </div>
      <div class="card-body">
        <div class="card-tags">
          <span class="card-tag genre">${q.genre}</span>
          <span class="card-tag format">${formatLabel}</span>
          ${q.subGenre ? `<span class="card-tag">${q.subGenre}</span>` : ''}
        </div>
        <div class="card-title">${q.title}</div>
        <div class="card-meta">
          <div class="card-meta-item"><div class="card-difficulty">${stars}</div></div>
          <div class="card-meta-item"><span>${q.players}</span></div>
          <div class="card-meta-item"><span>${q.estimatedTime}</span></div>
          <div class="card-meta-item"><span style="color:var(--star-fill)">★</span><span style="color:var(--neon-gold)">${q.reviewAvg}</span><span>(${q.reviewCount})</span></div>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-price">
          <span class="currency">¥</span>${q.price.toLocaleString()}
          <span class="tax">(税込)</span>
        </div>
        <div class="card-cta">詳細を見る →</div>
      </div>
    </div>
  `;
}

/* ── RENDER HOME BOARD (master function) ── */
function renderHomeBoard() {
  renderNewQuests();
  renderPopularQuests();
  renderHomeRanking();
  renderLatestReviews();
}

/* ── RENDER NEW QUESTS (isNew=true, max 3) ── */
function renderNewQuests() {
  const row = document.getElementById('new-quests-row');
  if (!row) return;
  const newQuests = quests.filter(q => q.isNew).slice(0, 3);
  if (!newQuests.length) {
    // Fallback: show latest 3 by id
    const latest = [...quests].sort((a, b) => b.id - a.id).slice(0, 3);
    row.innerHTML = latest.map(buildHomeQuestCardHtml).join('');
  } else {
    row.innerHTML = newQuests.map(buildHomeQuestCardHtml).join('');
  }
}

/* ── RENDER POPULAR QUESTS (top 3 by salesCount) ── */
function renderPopularQuests() {
  const row = document.getElementById('popular-quests-row');
  if (!row) return;
  const popular = [...quests].sort((a, b) => b.salesCount - a.salesCount).slice(0, 3);
  row.innerHTML = popular.map(buildHomeQuestCardHtml).join('');
}

/* ── RENDER HOME RANKING (Top 5 adventurers) ── */
function renderHomeRanking() {
  const list = document.getElementById('home-ranking-list');
  if (!list) return;
  const titleColors = {
    'マスター': '#d4a340',
    'エキスパート': '#c0c0c0',
    'ベテラン': '#cd7f32',
    'チャレンジャー': '#6ea8fe',
    'ルーキー': '#8a7a60',
  };
  const adventurers = [
    { name: '冒険者タロウ', img: 'images/quest-1-alchemy.webp', title: 'マスター', quests: 42 },
    { name: '迷宮のハナコ', img: 'images/quest-2-library.webp', title: 'エキスパート', quests: 35 },
    { name: '探索王ケンジ', img: 'images/quest-3-ruins.webp', title: 'ベテラン', quests: 28 },
    { name: '謎解きユキ', img: 'images/quest-4-clocktower.webp', title: 'チャレンジャー', quests: 18 },
    { name: '宝探しリョウ', img: 'images/quest-5-deepsea.webp', title: 'チャレンジャー', quests: 12 },
  ];
  list.innerHTML = adventurers.map((a, i) => `
    <div class="home-ranking-item ${i < 3 ? 'top-3' : ''}">
      <div class="home-ranking-pos">${i + 1}</div>
      <div class="home-ranking-thumb" style="border-radius:50%;overflow:hidden;border:1px solid var(--border-dim)">
        <img src="${a.img}" alt="${a.name}" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div class="home-ranking-info">
        <div class="home-ranking-name">${a.name}</div>
        <div class="home-ranking-meta">
          <span style="color:${titleColors[a.title] || 'var(--text-dim)'};font-weight:700">${a.title}</span>
          <span>${a.quests}クエスト達成</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── RENDER LATEST REVIEWS (3 most recent across all quests) ── */
function renderLatestReviews() {
  const row = document.getElementById('home-reviews-row');
  if (!row) return;
  const allReviews = [];
  quests.forEach(q => {
    (q.reviews || []).forEach(r => {
      allReviews.push({ ...r, questId: q.id, questTitle: q.title });
    });
  });
  allReviews.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const latest = allReviews.slice(0, 3);
  row.innerHTML = latest.map(r => `
    <div class="home-review-card" onclick="openQuestDetail(${r.questId})">
      <div class="home-review-quest-title">${r.questTitle}</div>
      <div class="home-review-stars">${'★'.repeat(r.stars)}${'<span class="empty">★</span>'.repeat(5 - r.stars)}</div>
      <div class="home-review-text">${r.text}</div>
      <div class="home-review-user">— ${r.user}</div>
    </div>
  `).join('');
}

/* ── QUEST CARD RENDERING (for search results grid) ── */
function renderQuestCards(list) {
  const grid = document.getElementById('quest-grid');
  const resultRow = document.getElementById('result-row');
  if (!grid) return;

  // Show the search results grid
  grid.style.display = 'grid';
  if (resultRow) resultRow.style.display = 'flex';

  if (!list.length) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <p>条件に合うクエストが見つかりませんでした</p>
      </div>`;
    const rc = document.getElementById('result-count');
    if (rc) rc.textContent = '0件のクエスト';
    return;
  }

  grid.innerHTML = list.map(q => {
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="star ${i < q.difficulty ? 'filled' : ''}">★</span>`
    ).join('');
    const formatLabel = { home: '自宅完結', outdoor: '現地型', hybrid: 'ハイブリッド' }[q.format] || q.format;

    return `
      <div class="quest-card" onclick="openQuestDetail(${q.id})">
        ${q.isNew ? '<div class="card-badge">NEW</div>' : ''}
        <div class="card-image">
          ${q.image ? `<img src="${q.image}" alt="${q.title}" loading="lazy">` : `<div style="width:100%;height:100%;background:var(--bg-panel)"></div>`}
        </div>
        <div class="card-body">
          <div class="card-tags">
            <span class="card-tag genre">${q.genre}</span>
            <span class="card-tag format">${formatLabel}</span>
            ${q.subGenre ? `<span class="card-tag">${q.subGenre}</span>` : ''}
          </div>
          <div class="card-title">${q.title}</div>
          <div class="card-tagline">${q.tagline}</div>
          <div class="card-meta">
            <div class="card-meta-item"><div class="card-difficulty">${stars}</div></div>
            <div class="card-meta-item"><span>${q.players}</span></div>
            <div class="card-meta-item"><span>${q.estimatedTime}</span></div>
            <div class="card-meta-item"><span>${q.region}</span></div>
          </div>
          <div class="card-meta" style="margin-top:0.3rem">
            <div class="card-meta-item">
              <span class="card-meta-icon" style="color:var(--star-fill)">★</span>
              <span style="color:var(--neon-gold)">${q.reviewAvg}</span>
              <span>(${q.reviewCount}件)</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-price">
            <span class="currency">¥</span>${q.price.toLocaleString()}
            <span class="tax">(税込・送料込)</span>
          </div>
          <div class="card-cta">詳細を見る →</div>
        </div>
      </div>
    `;
  }).join('');

  const rc = document.getElementById('result-count');
  if (rc) rc.textContent = `${list.length}件のクエスト`;
}

/* ── SEARCH & FILTER (Dropdown-based) ── */
let currentFilter = 'all';

function setPurposeFilter(purpose) {
  // Map purpose to genre filter dropdown
  const genreMap = { 'puzzle': '謎解き', 'boardgame': '体験型', 'home': '', 'outdoor': '', 'region': '' };
  const formatMap = { 'home': 'home', 'outdoor': 'outdoor' };
  const genreSelect = document.getElementById('filter-genre');
  const formatSelect = document.getElementById('filter-format');
  if (genreSelect && genreMap[purpose]) genreSelect.value = genreMap[purpose];
  if (formatSelect && formatMap[purpose]) formatSelect.value = formatMap[purpose];
  applyDropdownFilters();
  setTimeout(() => {
    const grid = document.getElementById('quest-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function setRegionFilter(region) {
  // Set keyword search to region name and apply
  const input = document.getElementById('search-input');
  if (input) input.value = region;
  applyDropdownFilters();
  setTimeout(() => {
    const grid = document.getElementById('quest-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function handleSearch() { applyDropdownFilters(); }
function handleSort() { applyDropdownFilters(); }

function applyDropdownFilters() {
  const keyword = (document.getElementById('search-input')?.value || '').toLowerCase();
  const genre = document.getElementById('filter-genre')?.value || '';
  const format = document.getElementById('filter-format')?.value || '';
  const difficulty = document.getElementById('filter-difficulty')?.value || '';
  const time = document.getElementById('filter-time')?.value || '';
  const price = document.getElementById('filter-price')?.value || '';
  const sort = document.getElementById('sort-select')?.value || 'newest';

  let filtered = quests.filter(q => {
    // Keyword
    if (keyword && !q.title.toLowerCase().includes(keyword) &&
        !q.genre.toLowerCase().includes(keyword) &&
        !q.subGenre?.toLowerCase().includes(keyword) &&
        !q.region.toLowerCase().includes(keyword)) return false;
    // Genre
    if (genre && q.genre !== genre && q.subGenre !== genre) return false;
    // Format
    if (format && q.format !== format) return false;
    // Difficulty
    if (difficulty && q.difficulty !== parseInt(difficulty)) return false;
    // Time
    if (time === 'short' && !q.estimatedTime.includes('1') && !q.estimatedTime.includes('2')) return false;
    if (time === 'medium' && !q.estimatedTime.includes('2') && !q.estimatedTime.includes('3') && !q.estimatedTime.includes('4')) return false;
    if (time === 'long' && !q.estimatedTime.includes('5') && !q.estimatedTime.includes('6')) return false;
    // Price
    if (price === 'low' && q.price > 2000) return false;
    if (price === 'mid' && (q.price <= 2000 || q.price > 4000)) return false;
    if (price === 'high' && q.price <= 4000) return false;
    return true;
  });

  switch (sort) {
    case 'newest': filtered.sort((a, b) => b.id - a.id); break;
    case 'popular': filtered.sort((a, b) => b.salesCount - a.salesCount); break;
    case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
    case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
  }

  renderQuestCards(filtered);
}

/* Legacy filter function kept for compatibility */
function applyFilters() { applyDropdownFilters(); }

/* Show all quests — triggered by "もっと見る" buttons */
function showAllQuests() {
  // Reset all filters
  ['filter-genre', 'filter-format', 'filter-difficulty', 'filter-time', 'filter-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const sortEl = document.getElementById('sort-select');
  if (sortEl) sortEl.value = 'newest';
  const inputEl = document.getElementById('search-input');
  if (inputEl) inputEl.value = '';
  applyDropdownFilters();
  setTimeout(() => {
    const section = document.getElementById('home-search');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/* ── QUEST DETAIL ── */
let userLikedReviewIds = new Set();

function openQuestDetail(questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;
  navigateTo('detail', {
    transitionText: '依頼書を準備中...',
    delay: 700,
    onShow: () => {
      userLikedReviewIds = new Set();
      renderDetail(quest);
      // Load user's existing likes async (update UI after)
      if (db && userState.loggedIn) {
        (async () => {
          try {
            const { data: { user } } = await db.auth.getUser();
            if (user) {
              const reviewIds = quest.reviews.filter(r => r.id).map(r => r.id);
              if (reviewIds.length) {
                const { data: likes } = await db
                  .from('review_likes')
                  .select('review_id')
                  .eq('user_id', user.id)
                  .in('review_id', reviewIds);
                if (likes) {
                  likes.forEach(l => userLikedReviewIds.add(l.review_id));
                  document.querySelectorAll('.review-like-btn').forEach(btn => {
                    const rid = parseInt(btn.dataset.reviewId);
                    if (userLikedReviewIds.has(rid)) btn.classList.add('liked');
                  });
                }
              }
            }
          } catch (e) { /* silent */ }
        })();
      }
    },
  });
}

function renderDetail(quest) {
  const stars = n => Array.from({ length: 5 }, (_, i) => `<span class="star ${i < n ? 'filled' : ''}">★</span>`).join('');
  const reviewStars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  const isAccepted = userState.acceptedQuests.includes(quest.id);
  const formatLabel = { home: '自宅完結', outdoor: '現地型', hybrid: 'ハイブリッド' }[quest.format] || quest.format;

  const dist = [0, 0, 0, 0, 0];
  quest.reviews.forEach(r => dist[r.stars - 1]++);
  const maxDist = Math.max(...dist, 1);

  const cartBtnHtml = `<button class="btn-accept" onclick="acceptQuest(${quest.id})">このクエストを受諾する</button>`;

  const container = document.getElementById('detail-content');
  container.innerHTML = `
    <button class="detail-back" onclick="navigateTo('quest-board', {transitionText:'掲示板に戻ります...',delay:500})">
      ← 掲示板に戻る
    </button>

    <div class="detail-hero">
      ${quest.image ? `<img src="${quest.image}" alt="${quest.title}">` : '<div style="width:100%;height:100%;background:var(--bg-panel)"></div>'}
    </div>

    <div class="detail-header">
      <div class="detail-header-top">
        <div class="detail-rank">RANK ${quest.rank}</div>
        <button class="detail-fav-btn ${userState.favorites.includes(quest.id) ? 'favorited' : ''}" onclick="toggleFavorite(${quest.id}, this)" aria-label="お気に入り">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="${userState.favorites.includes(quest.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="detail-title">${quest.title}</div>
      <div class="detail-tagline">${quest.tagline}</div>
    </div>

    <div class="detail-specs">
      <div class="spec-item"><div class="spec-label">難易度</div><div class="spec-value"><div class="card-difficulty">${stars(quest.difficulty)}</div></div></div>
      <div class="spec-item"><div class="spec-label">プレイ人数</div><div class="spec-value">${quest.players}</div></div>
      <div class="spec-item"><div class="spec-label">所要時間</div><div class="spec-value">${quest.estimatedTime}</div></div>
      <div class="spec-item"><div class="spec-label">形式</div><div class="spec-value">${formatLabel}</div></div>
      <div class="spec-item"><div class="spec-label">ジャンル</div><div class="spec-value">${quest.genre} × ${quest.subGenre}</div></div>
      <div class="spec-item"><div class="spec-label">評価</div><div class="spec-value"><span class="stars">${reviewStars(quest.reviewAvg)}</span> ${quest.reviewAvg}</div></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">プロローグ</div>
      <div class="prologue-box">${quest.prologue}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">支給アイテム</div>
      <div class="items-grid">
        ${quest.items.map(it => `<div class="item-card"><div class="item-icon">${it.icon}</div><div class="item-name">${it.name}</div></div>`).join('')}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">注意事項</div>
      <ul class="caution-list">
        ${(quest.cautions || []).map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>

    <!-- ACCEPTANCE / CART -->
    <div class="accept-area ${isAccepted ? 'accepted' : ''}" id="accept-area-${quest.id}">
      <div class="accept-header">
        <div class="accept-title">クエスト受注書</div>
        <div class="accept-subtitle">— QUEST ORDER FORM —</div>
      </div>
      <div class="accept-body">
        <div class="supply-label">◆ 支給予定アイテム</div>
        <div class="supply-items">
          ${quest.items.map(it => `<div class="supply-item"><div class="supply-item-icon">${it.icon}</div><div class="supply-item-name">${it.name}</div></div>`).join('')}
        </div>
        <div class="accept-price-area">
          <div class="accept-price-label">報酬金（お支払い額）</div>
          <div class="accept-price">¥${quest.price.toLocaleString()}</div>
          <div class="accept-shipping">税込・送料込 ／ 発送目安：受注後3〜5営業日</div>
        </div>
        ${isAccepted ? '' : cartBtnHtml}
      </div>
      <div class="acceptance-stamp" id="stamp-${quest.id}">受 諾</div>
      <div class="accept-complete-msg">
        <p>クエストを受諾しました。</p>
        <p><span class="highlight">数日後、あなたのポストに "物語の始まり" が届きます。</span></p>
        <button class="btn-outline" onclick="navigateTo('mypage')" style="margin-top:1rem">マイクエストを確認する →</button>
      </div>
    </div>

    <!-- REVIEWS -->
    <div class="reviews-section">
      <div class="detail-section-title">冒険者レビュー</div>
      <div class="reviews-header">
        <div class="reviews-total">総数：<strong>${quest.reviewCount}</strong>件</div>
        <button class="btn-write-review" onclick="showReviewForm(${quest.id})">✏️ レビューを書く</button>
      </div>
      <div class="review-summary">
        <div class="review-avg">
          <div class="review-avg-num">${quest.reviewAvg}</div>
          <div class="review-avg-stars">${reviewStars(quest.reviewAvg)}</div>
          <div class="review-avg-count">${quest.reviewCount}件の評価</div>
        </div>
        <div class="review-bars">
          ${[5,4,3,2,1].map(n => `
            <div class="review-bar-row">
              <div class="review-bar-label">${n}</div>
              <div class="review-bar"><div class="review-bar-fill" style="width:${(dist[n-1] / maxDist) * 100}%"></div></div>
              <div class="review-bar-count">${dist[n-1]}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Review Form (hidden by default) -->
      <div class="review-form" id="review-form-${quest.id}" style="display:none">
        <div class="review-form-title">レビューを投稿</div>
        <div class="review-form-stars" id="review-stars-${quest.id}">
          ${[1,2,3,4,5].map(n => `<span class="review-form-star" data-rating="${n}" onclick="setReviewRating(${quest.id}, ${n})">☆</span>`).join('')}
        </div>
        <textarea class="review-form-text" id="review-text-${quest.id}" placeholder="レビューを入力..." rows="4"></textarea>
        <div class="review-form-sub">
          <label>できたえ: <select id="review-craft-${quest.id}"><option value="5">5</option><option value="4">4</option><option value="3" selected>3</option><option value="2">2</option><option value="1">1</option></select></label>
          <label>ストーリー: <select id="review-story-${quest.id}"><option value="5">5</option><option value="4">4</option><option value="3" selected>3</option><option value="2">2</option><option value="1">1</option></select></label>
          <label>ボリューム: <select id="review-volume-${quest.id}"><option value="5">5</option><option value="4">4</option><option value="3" selected>3</option><option value="2">2</option><option value="1">1</option></select></label>
        </div>
        <button class="btn-accept" onclick="submitReview(${quest.id})">レビューを投稿する</button>
        <div class="review-form-error" id="review-error-${quest.id}"></div>
      </div>

      <div class="review-list">
        ${quest.reviews.map((r, ri) => `
          <div class="review-card">
            <div class="review-quest-bar" onclick="openQuestDetail(${quest.id})">
              <span class="review-quest-bar-icon">◆</span>
              【${quest.title}】
            </div>
            <div class="review-card-body">
              <div class="review-card-header">
                <div class="review-user">
                  <div class="review-user-avatar">${r.avatar}</div>
                  <div class="review-user-info">
                    <div class="review-user-name">${r.user}</div>
                    <div class="review-user-rank">
                      Lv.${r.level || '?'} / RANK : ${r.rank || '?'}
                      <span class="review-user-title-badge">${r.title}</span>
                    </div>
                  </div>
                </div>
                <div class="review-date">${r.date}</div>
              </div>
              <div class="review-stars-row">
                <div class="review-stars">${'★'.repeat(r.stars)}${'<span class="empty">★</span>'.repeat(5 - r.stars)}</div>
              </div>
              <div class="review-text">${r.text}</div>
              ${r.sub ? `
                <div class="review-sub-ratings">
                  <div class="review-sub-item"><span class="review-sub-label">できたえ：</span><span class="review-sub-value">${r.sub.craft}</span></div>
                  <div class="review-sub-item"><span class="review-sub-label">ストーリー：</span><span class="review-sub-value">${r.sub.story}</span></div>
                  <div class="review-sub-item"><span class="review-sub-label">ボリューム：</span><span class="review-sub-value">${r.sub.volume}</span></div>
                </div>
              ` : ''}
              <div class="review-card-footer">
                <button class="review-like-btn ${r.id && userLikedReviewIds.has(r.id) ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike(this, ${quest.id}, ${ri})">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg> ${r.likes || 0}
                </button>
                <span class="review-report" onclick="reportReview(this, ${quest.id}, ${ri})">不適切なレビューを報告</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ── REVIEW FORM ── */
let reviewRatings = {};

function showReviewForm(questId) {
  const form = document.getElementById(`review-form-${questId}`);
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function reportReview(el, questId, reviewIdx) {
  const card = el.closest('.review-card');
  if (!card) return;
  if (card.querySelector('.report-confirm')) return;

  const confirm = document.createElement('div');
  confirm.className = 'report-confirm';
  confirm.innerHTML = `
    <div class="report-confirm-text">このレビューを運営に報告しますか？</div>
    <p style="font-size:0.75rem;color:var(--text-dim);margin:0 0 0.6rem">運営が確認後、不適切と判断した場合に削除されます。</p>
    <div class="report-confirm-btns">
      <button class="report-confirm-yes" onclick="executeReport(this, ${questId}, ${reviewIdx})">報告する</button>
      <button class="report-confirm-no" onclick="this.closest('.report-confirm').remove()">キャンセル</button>
    </div>
  `;
  card.appendChild(confirm);
}

function executeReport(btn, questId, reviewIdx) {
  // Save report to DB (non-blocking)
  if (db) {
    (async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        await db.from('review_reports').insert({
          quest_id: questId,
          review_index: reviewIdx,
          reporter_id: user?.id || null,
        });
      } catch(e) { console.warn('Report save:', e); }
    })();
  }

  // UI feedback — mark as reported (don't delete)
  const card = btn.closest('.review-card');
  const confirm = card?.querySelector('.report-confirm');
  if (confirm) confirm.remove();
  if (card) {
    const badge = document.createElement('div');
    badge.className = 'report-badge';
    badge.textContent = '報告済み — 運営が確認します';
    card.appendChild(badge);
  }
  // Disable further reports on this card
  const reportLink = card?.querySelector('.review-report');
  if (reportLink) { reportLink.style.display = 'none'; }

  showToast('報告を送信しました。運営が確認いたします。');
}

function setReviewRating(questId, rating) {
  reviewRatings[questId] = rating;
  const container = document.getElementById(`review-stars-${questId}`);
  if (!container) return;
  container.querySelectorAll('.review-form-star').forEach((star, i) => {
    star.textContent = i < rating ? '★' : '☆';
    star.classList.toggle('active', i < rating);
  });
}

function submitReview(questId) {
  const rating = reviewRatings[questId] || 0;
  const text = document.getElementById(`review-text-${questId}`)?.value.trim();
  const errorEl = document.getElementById(`review-error-${questId}`);
  if (!rating) { errorEl.textContent = '⚠ 星評価を選択してください'; errorEl.style.display = 'block'; return; }
  if (!text) { errorEl.textContent = '⚠ レビュー内容を入力してください'; errorEl.style.display = 'block'; return; }
  errorEl.textContent = '';
  errorEl.style.display = '';

  const craft = parseInt(document.getElementById(`review-craft-${questId}`)?.value || '3');
  const story = parseInt(document.getElementById(`review-story-${questId}`)?.value || '3');
  const volume = parseInt(document.getElementById(`review-volume-${questId}`)?.value || '3');

  // Add to local data immediately
  const quest = quests.find(q => q.id === questId);
  if (quest) {
    quest.reviews.unshift({
      user: userState.name, title: userState.title, avatar: getAvatarChar(),
      level: userState.questsAccepted * 5, rank: quest.rank,
      stars: rating, date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      text, sub: { craft, story, volume }, likes: 0,
    });
    quest.reviewCount++;
    const total = quest.reviews.reduce((s, r) => s + r.stars, 0);
    quest.reviewAvg = parseFloat((total / quest.reviews.length).toFixed(1));
    renderDetail(quest);
  }
  showToast('レビューを投稿しました！');
  trackEvent('submit_review', { quest_id: questId, rating });

  // Save to DB in background (non-blocking)
  if (db) {
    (async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        if (!user) return;
        await db.from('reviews').insert({
          quest_id: questId, user_id: user.id, rating, text,
          sub_ratings: { craft, story, volume },
        });
      } catch(e) { console.warn('Review DB save:', e); }
    })();
  }
}

/* ── ACCEPT QUEST ── */
async function acceptQuest(questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest || userState.acceptedQuests.includes(questId)) return;

  playAcceptSFX();

  // 受諾状態をローカルに即反映
  userState.acceptedQuests.push(questId);

  // UI即時更新 — 緑の受諾マークをすぐ表示
  const area = document.getElementById(`accept-area-${questId}`);
  const btn = area?.querySelector('.btn-accept');
  if (btn) { btn.textContent = '受諾処理中...'; btn.style.pointerEvents = 'none'; }
  setTimeout(() => {
    if (area) area.classList.add('accepted');
    if (btn) btn.remove();
    showToast('クエストを受諾しました！');
    updateCartBadge();
  }, 800);

  trackEvent('accept_quest', { quest_id: questId, quest_name: quest.title });

  // ネットワーク処理はバックグラウンドで実行（UIをブロックしない）
  if (shopifyClient && shopifyCheckout && quest.shopifyVariantId) {
    shopifyClient.checkout.addLineItems(shopifyCheckout.id, [{ variantId: quest.shopifyVariantId, quantity: 1 }])
      .then(checkout => { shopifyCheckout = checkout; updateCartBadge(); })
      .catch(e => console.warn('Cart add failed:', e.message));
  }
  if (db) {
    db.auth.getUser().then(({ data: { user } }) => {
      if (user) db.from('accepted_quests').upsert({ user_id: user.id, quest_id: questId, status: 'in_cart' });
    }).catch(() => {});
  }
}

function playAcceptSFX() {
  try {
    const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(ctx.destination);
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0.5, now + i * 0.1);
      env.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
      osc.connect(env); env.connect(gain);
      osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.5);
    });
    [523.25, 659.25, 783.99].forEach(freq => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0.3, now + 0.5);
      env.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      osc.connect(env); env.connect(gain);
      osc.start(now + 0.5); osc.stop(now + 1.6);
    });
  } catch (e) {}
}

/* ── SHOPIFY CART ── */
async function addToCart(questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest || !shopifyClient || !shopifyCheckout) return;

  try {
    const lineItems = [{ variantId: quest.shopifyVariantId, quantity: 1 }];
    shopifyCheckout = await shopifyClient.checkout.addLineItems(shopifyCheckout.id, lineItems);
    updateCartBadge();
    openCart();
    trackEvent('add_to_cart', { quest_id: questId, quest_name: quest.title, value: quest.price });
  } catch (e) {
    console.error('Cart error:', e);
  }
}

async function removeFromCart(lineItemId) {
  if (!shopifyClient || !shopifyCheckout) return;
  shopifyCheckout = await shopifyClient.checkout.removeLineItems(shopifyCheckout.id, [lineItemId]);
  updateCartBadge();
  renderCartDrawer();
}

async function updateCartQuantity(lineItemId, qty) {
  if (!shopifyClient || !shopifyCheckout) return;
  shopifyCheckout = await shopifyClient.checkout.updateLineItems(shopifyCheckout.id, [{ id: lineItemId, quantity: qty }]);
  updateCartBadge();
  renderCartDrawer();
}

function proceedToCheckout() {
  if (!shopifyCheckout?.webUrl) return;
  trackEvent('begin_checkout', { value: shopifyCheckout.totalPrice });
  window.open(shopifyCheckout.webUrl, '_blank');
}

function updateCartBadge() {
  const shopifyCount = shopifyCheckout?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const count = shopifyCount || userState.acceptedQuests.length;
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function renderCartDrawer() {
  const itemsEl = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');

  // Shopifyカートがあればそれを表示
  if (shopifyCheckout?.lineItems?.length) {
    itemsEl.innerHTML = shopifyCheckout.lineItems.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">¥${parseInt(item.variant.price.amount).toLocaleString()}</div>
        </div>
        <div class="cart-item-actions">
          <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
          <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
        </div>
      </div>
    `).join('');
    footerEl.style.display = 'block';
    document.getElementById('cart-total-price').textContent = `¥${parseInt(shopifyCheckout.totalPrice.amount).toLocaleString()}`;
    return;
  }

  // Shopify未接続時：ローカルの受諾済みクエストを表示
  const acceptedItems = userState.acceptedQuests.map(qid => quests.find(q => q.id === qid)).filter(Boolean);
  if (!acceptedItems.length) {
    itemsEl.innerHTML = '<div class="cart-empty">カートは空です</div>';
    footerEl.style.display = 'none';
    return;
  }

  const total = acceptedItems.reduce((sum, q) => sum + q.price, 0);
  itemsEl.innerHTML = acceptedItems.map(q => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-title">${q.title}</div>
        <div class="cart-item-price">¥${q.price.toLocaleString()}</div>
      </div>
      <div class="cart-item-actions">
        <span>1</span>
        <button class="cart-item-remove" onclick="removeLocalCart(${q.id})">✕</button>
      </div>
    </div>
  `).join('');
  footerEl.style.display = 'block';
  document.getElementById('cart-total-price').textContent = `¥${total.toLocaleString()}`;
}

function removeLocalCart(questId) {
  userState.acceptedQuests = userState.acceptedQuests.filter(id => id !== questId);
  updateCartBadge();
  renderCartDrawer();
  // accept-areaのUIもリセット
  const area = document.getElementById(`accept-area-${questId}`);
  if (area) area.classList.remove('accepted');
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cart-overlay').classList.add('active');
  document.getElementById('cart-drawer').classList.add('active');
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('active');
  document.getElementById('cart-drawer').classList.remove('active');
}

/* ── RANKINGS ── */
function switchRankingTab(tab, btn) {
  document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderRanking(tab);
}

function renderRanking(tab = 'popular') {
  const list = document.getElementById('ranking-list');

  if (tab === 'popular') {
    const sorted = [...quests].sort((a, b) => b.salesCount - a.salesCount);
    list.innerHTML = sorted.map((q, i) => `
      <div class="ranking-item ${i < 3 ? 'top-3' : ''}" onclick="openQuestDetail(${q.id})">
        <div class="ranking-pos">${i + 1}</div>
        <div class="ranking-thumb">${q.image ? `<img src="${q.image}" alt="${q.title}" loading="lazy">` : ''}</div>
        <div class="ranking-info">
          <div class="ranking-info-title">${q.title}</div>
          <div class="ranking-info-meta"><span>${q.genre}</span><span>★${q.reviewAvg}</span><span>¥${q.price.toLocaleString()}</span></div>
        </div>
        <div class="ranking-score"><div class="ranking-score-num">${q.salesCount}</div><div class="ranking-score-label">受注数</div></div>
      </div>
    `).join('');
  } else if (tab === 'rated') {
    const sorted = [...quests].sort((a, b) => b.reviewAvg - a.reviewAvg);
    list.innerHTML = sorted.map((q, i) => `
      <div class="ranking-item ${i < 3 ? 'top-3' : ''}" onclick="openQuestDetail(${q.id})">
        <div class="ranking-pos">${i + 1}</div>
        <div class="ranking-thumb">${q.image ? `<img src="${q.image}" alt="${q.title}" loading="lazy">` : ''}</div>
        <div class="ranking-info">
          <div class="ranking-info-title">${q.title}</div>
          <div class="ranking-info-meta"><span>${q.genre}</span><span>${q.reviewCount}件のレビュー</span></div>
        </div>
        <div class="ranking-score"><div class="ranking-score-num">★${q.reviewAvg}</div><div class="ranking-score-label">評価</div></div>
      </div>
    `).join('');
  } else if (tab === 'adventurers') {
    const adventurers = [
      { name: '深淵の探索者', avatar: '深', title: '賢者', quests: 12, score: 3200 },
      { name: '黒鉄の剣士', avatar: '黒', title: '勇者', quests: 8, score: 2100 },
      { name: '炎の魔術師', avatar: '炎', title: '勇者', quests: 7, score: 1800 },
      { name: '月影の魔女', avatar: '月', title: '冒険者', quests: 5, score: 1200 },
      { name: '白銀の聖女', avatar: '白', title: '冒険者', quests: 4, score: 950 },
    ];
    list.innerHTML = adventurers.map((a, i) => `
      <div class="ranking-item ${i < 3 ? 'top-3' : ''}">
        <div class="ranking-pos">${i + 1}</div>
        <div class="ranking-thumb" style="border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">${a.avatar}</div>
        <div class="ranking-info">
          <div class="ranking-info-title">${a.name}</div>
          <div class="ranking-info-meta"><span style="color:var(--neon-green)">${a.title}</span><span>${a.quests}クエスト完了</span></div>
        </div>
        <div class="ranking-score"><div class="ranking-score-num">${a.score.toLocaleString()}</div><div class="ranking-score-label">ポイント</div></div>
      </div>
    `).join('');
  } else if (tab === 'creators') {
    const creators = [
      { name: '古代の語り部', avatar: '古', quests: 3, sales: 420, rating: 4.8 },
      { name: '幻影の錬金術師', avatar: '幻', quests: 2, sales: 268, rating: 4.7 },
      { name: '深海の設計士', avatar: '海', quests: 1, sales: 203, rating: 4.8 },
    ];
    list.innerHTML = creators.map((c, i) => `
      <div class="ranking-item ${i < 3 ? 'top-3' : ''}">
        <div class="ranking-pos">${i + 1}</div>
        <div class="ranking-thumb" style="border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">${c.avatar}</div>
        <div class="ranking-info">
          <div class="ranking-info-title">${c.name}</div>
          <div class="ranking-info-meta"><span>${c.quests}作品</span><span>★${c.rating}</span></div>
        </div>
        <div class="ranking-score"><div class="ranking-score-num">${c.sales}</div><div class="ranking-score-label">総受注数</div></div>
      </div>
    `).join('');
  }
}

/* ── MY PAGE ── */
function renderMyPage() {
  const container = document.getElementById('mypage-content');

  // Not logged in → show guest mypage with auth form
  if (!userState.loggedIn) {
    container.innerHTML = `
      <!-- Guest Profile Header -->
      <div class="mypage-guest-header">
        <div class="mypage-guest-banner">全ての機能を利用するには会員登録が必要です</div>
        <div class="mypage-profile">
          <div class="mypage-avatar">？</div>
          <div class="mypage-info">
            <div class="mypage-name">ゲスト</div>
            <div class="mypage-title" style="opacity:0.5">LV --- / RANK ---</div>
          </div>
        </div>
      </div>

      <!-- Mypage Tabs (disabled for guest) -->
      <div class="mypage-guest-tabs">
        <button class="mypage-guest-tab active">ステータス</button>
        <button class="mypage-guest-tab" disabled>お気に入り</button>
        <button class="mypage-guest-tab" disabled>クエスト履歴</button>
        <button class="mypage-guest-tab" disabled>通知</button>
      </div>

      <!-- Login Section -->
      <div class="mypage-auth-section">
        <div class="mypage-auth-card">
          <h2 class="mypage-auth-heading">ログイン</h2>
          <form class="auth-form" onsubmit="handleAuth(event)">
            <div class="auth-field">
              <label class="auth-label">メールアドレス</label>
              <input type="email" id="auth-email" placeholder="mail@example.com" required autocomplete="email">
            </div>
            <div class="auth-field">
              <label class="auth-label">パスワード</label>
              <div class="auth-field-pw">
                <input type="password" id="auth-password" placeholder="パスワード（6文字以上）" required minlength="6" autocomplete="current-password">
                <button type="button" class="pw-toggle" onclick="togglePwVisibility('auth-password', this)" aria-label="パスワード表示">
                  <svg class="pw-eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg class="pw-eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>
            <div class="auth-error" id="auth-error"></div>
            <button type="submit" class="btn-login btn-adventurer" id="auth-submit-btn">
              <span id="auth-submit-text">ログイン</span>
            </button>
          </form>
          <div class="auth-links">
            <button class="auth-link" onclick="showPasswordReset()">パスワードをお忘れですか？</button>
          </div>
          <div class="auth-reset-form" id="auth-reset-form" style="display:none">
            <p class="auth-reset-desc">登録メールアドレスにリセットリンクを送信します</p>
            <div class="auth-field">
              <input type="email" id="reset-email" placeholder="メールアドレス" required>
            </div>
            <div class="auth-error" id="reset-error"></div>
            <button class="btn-login btn-adventurer" onclick="handlePasswordReset()">リセットリンクを送信</button>
            <button class="auth-link" onclick="backToLogin()" style="margin-top:0.5rem">← ログインに戻る</button>
          </div>
        </div>
      </div>

      <!-- Signup CTA Section -->
      <div class="mypage-signup-section">
        <div class="mypage-signup-card">
          <h3 class="mypage-signup-heading">会員登録がお済みでない方へ</h3>
          <p class="mypage-signup-desc">こちらより新規会員登録へお進みください。</p>
          <button class="btn-signup-cta" onclick="switchToSignup()">新規冒険者登録 →</button>
        </div>

        <!-- Hidden signup form -->
        <div class="mypage-auth-card" id="signup-form-card" style="display:none">
          <h2 class="mypage-auth-heading">新規冒険者登録</h2>
          <form class="auth-form" onsubmit="handleSignup(event)">
            <div class="auth-field">
              <label class="auth-label">冒険者名</label>
              <input type="text" id="signup-name" placeholder="表示名を入力" autocomplete="name">
            </div>
            <div class="auth-field">
              <label class="auth-label">メールアドレス</label>
              <input type="email" id="signup-email" placeholder="mail@example.com" required autocomplete="email">
            </div>
            <div class="auth-field">
              <label class="auth-label">パスワード</label>
              <div class="auth-field-pw">
                <input type="password" id="signup-password" placeholder="パスワード（6文字以上）" required minlength="6" autocomplete="new-password">
                <button type="button" class="pw-toggle" onclick="togglePwVisibility('signup-password', this)" aria-label="パスワード表示">
                  <svg class="pw-eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg class="pw-eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>
            <div class="auth-error" id="signup-error"></div>
            <button type="submit" class="btn-login btn-adventurer" id="signup-submit-btn">
              <span id="signup-submit-text">冒険者ギルドに登録</span>
            </button>
          </form>
          <div class="auth-links">
            <button class="auth-link" onclick="switchToLogin()">← ログインに戻る</button>
          </div>
        </div>
      </div>

      <!-- JOIN Banner -->
      <div class="mypage-join-banner">
        <div class="mypage-join-title">JOIN THE ADVENTURERS</div>
        <div class="mypage-join-desc">無料冒険者登録でリアクエをもっと楽しく！</div>
        <div class="mypage-join-features">
          <span>◆ クエストクーポンがメールで届く</span>
          <span>◆ コインを集めて商品ゲット</span>
          <span>◆ 上位ランカー限定イベントも開催</span>
        </div>
      </div>
    `;
    return;
  }

  const currentTitleIdx = titleLevels.findIndex(t => t.name === userState.title);
  const nextTitle = titleLevels[currentTitleIdx + 1];
  const progress = nextTitle
    ? ((userState.questsAccepted - titleLevels[currentTitleIdx].min) / (nextTitle.min - titleLevels[currentTitleIdx].min)) * 100
    : 100;

  container.innerHTML = `
    <div class="mypage-profile">
      <div class="mypage-avatar">${getAvatarChar()}</div>
      <div class="mypage-info">
        <div class="mypage-name">${userState.name}</div>
        <div class="mypage-title">${userState.title}</div>
        <div class="mypage-stats-row">
          <div class="mypage-stat-item"><div class="mypage-stat-num">${userState.questsAccepted}</div><div class="mypage-stat-label">受諾済み</div></div>
          <div class="mypage-stat-item"><div class="mypage-stat-num">${userState.coins}</div><div class="mypage-stat-label">コイン</div></div>
        </div>
      </div>
    </div>

    <!-- Mypage Tabs -->
    <div class="mypage-tabs">
      <button class="mypage-tab active" onclick="switchMypageTab('status', this)">ステータス</button>
      <button class="mypage-tab" onclick="switchMypageTab('favorites', this)">お気に入り</button>
      <button class="mypage-tab" onclick="switchMypageTab('history', this)">クエスト履歴</button>
      <button class="mypage-tab" onclick="switchMypageTab('notifications', this)">通知</button>
    </div>

    <!-- Tab: ステータス -->
    <div class="mypage-tab-content" id="mypage-tab-status">
      <div class="title-progress">
        <div class="title-progress-header">
          <div class="title-progress-label">称号レベル</div>
          <div class="title-progress-next">${nextTitle ? `次の称号: ${nextTitle.name}（あと${nextTitle.min - userState.questsAccepted}回受諾）` : '最高ランク達成！'}</div>
        </div>
        <div class="title-bar"><div class="title-bar-fill" style="width:${Math.min(progress, 100)}%"></div></div>
        <div class="title-steps">
          ${titleLevels.map((t, i) => `<div class="title-step ${i < currentTitleIdx ? 'achieved' : i === currentTitleIdx ? 'current' : ''}">${t.name}</div>`).join('')}
        </div>
      </div>
      <div class="mypage-status-summary">
        <div class="mypage-summary-card">
          <div class="mypage-summary-num">${userState.questsAccepted}</div>
          <div class="mypage-summary-label">受諾済みクエスト</div>
        </div>
        <div class="mypage-summary-card" onclick="navigateTo('coin-shop')" style="cursor:pointer">
          <div class="mypage-summary-num" style="color:var(--neon-gold)">${userState.coins}</div>
          <div class="mypage-summary-label">コイン残高</div>
        </div>
      </div>
    </div>

    <!-- Tab: お気に入り -->
    <div class="mypage-tab-content" id="mypage-tab-favorites" style="display:none">
      ${userState.favorites && userState.favorites.length ? `
        <div class="my-quest-list">
          ${userState.favorites.map(qid => {
            const q = quests.find(quest => quest.id === qid);
            if (!q) return '';
            return `
              <div class="my-quest-item" onclick="openQuestDetail(${q.id})">
                <div class="my-quest-thumb">${q.image ? `<img src="${q.image}" alt="${q.title}" loading="lazy">` : ''}</div>
                <div class="my-quest-info">
                  <div class="my-quest-title">${q.title}</div>
                  <div class="my-quest-meta">★${q.reviewAvg} (${q.reviewCount}件) ・ ¥${q.price?.toLocaleString()}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <div class="empty-state-text">お気に入りのクエストはまだありません</div>
          <p style="font-size:0.8rem;color:var(--text-dim);margin-top:0.5rem">クエスト詳細ページの♡ボタンで追加できます</p>
          <button class="btn-outline" onclick="navigateTo('quest-board')" style="margin-top:1rem">クエストを探す →</button>
        </div>
      `}
    </div>

    <!-- Tab: クエスト履歴 -->
    <div class="mypage-tab-content" id="mypage-tab-history" style="display:none">
      ${userState.acceptedQuests.length ? `
        <div class="my-quest-list">
          ${userState.acceptedQuests.map(qid => {
            const q = quests.find(quest => quest.id === qid);
            if (!q) return '';
            return `
              <div class="my-quest-item" onclick="openQuestDetail(${q.id})">
                <div class="my-quest-thumb">${q.image ? `<img src="${q.image}" alt="${q.title}" loading="lazy">` : ''}</div>
                <div class="my-quest-info">
                  <div class="my-quest-title">${q.title}</div>
                  <span class="my-quest-status shipping">購入済み</span>
                </div>
                <div class="my-quest-date">購入日: 今日</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="empty-state-text">クエスト履歴はまだありません</div>
          <button class="btn-outline" onclick="navigateTo('quest-board')">クエストに挑戦する →</button>
        </div>
      `}
    </div>

    <!-- Tab: 通知 -->
    <div class="mypage-tab-content" id="mypage-tab-notifications" style="display:none">
      <div class="empty-state">
        <div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
        <div class="empty-state-text">新しい通知はありません</div>
      </div>
    </div>

    <div style="margin-top:2rem; text-align:center;">
      <button class="btn-outline" onclick="handleLogout()" style="color:var(--accent-red); border-color:var(--accent-red);">ログアウト</button>
    </div>
  `;
}

function toggleFavorite(questId, btn) {
  const idx = userState.favorites.indexOf(questId);
  if (idx >= 0) {
    userState.favorites.splice(idx, 1);
    btn.classList.remove('favorited');
    btn.querySelector('svg').setAttribute('fill', 'none');
    showToast('お気に入りから削除しました');
  } else {
    userState.favorites.push(questId);
    btn.classList.add('favorited');
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    showToast('お気に入りに追加しました');
  }
  // Save to localStorage
  localStorage.setItem('rq_favorites', JSON.stringify(userState.favorites));
}

/* ── AVATAR (名前の頭文字) ── */
function getAvatarChar() {
  return userState.name ? userState.name.charAt(0) : '冒';
}

function switchMypageTab(tabName, btn) {
  document.querySelectorAll('.mypage-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.mypage-tab').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('mypage-tab-' + tabName);
  if (target) target.style.display = '';
  if (btn) btn.classList.add('active');
}

/* ── REVIEW LIKE ── */
async function toggleLike(btn, questId, reviewIdx) {
  const quest = quests.find(q => q.id === questId);
  if (!quest || !quest.reviews[reviewIdx]) return;

  const review = quest.reviews[reviewIdx];
  const isLiked = btn.classList.contains('liked');

  // Optimistic UI update
  if (isLiked) {
    btn.classList.remove('liked');
    review.likes = Math.max(0, (review.likes || 0) - 1);
  } else {
    btn.classList.add('liked');
    review.likes = (review.likes || 0) + 1;
  }
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg> ${review.likes}`;

  // Persist to Supabase using real review ID
  if (db && review.id) {
    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) return;
      if (!isLiked) {
        // Was not liked → add like
        await db.from('review_likes').insert({ user_id: user.id, review_id: review.id });
      } else {
        // Was liked → remove like
        await db.from('review_likes').delete().eq('user_id', user.id).eq('review_id', review.id);
      }
    } catch (e) { /* silent */ }
  }
}

/* ── PAGE: GUIDE (初めての方へ) ── */
function renderGuidePage() {
  const container = document.getElementById('guide-content');
  if (!container) return;
  container.innerHTML = `
    <button class="subpage-back" onclick="navigateTo('quest-board')">← 掲示板に戻る</button>
    <div class="subpage-hero">
      <div class="subpage-hero-title">REAL QUESTとは？</div>
      <div class="subpage-hero-sub">— BEGINNER'S GUIDE —</div>
    </div>

    <div class="guide-intro">
      REAL QUESTは、物語アイテムが自宅に届き、<br>
      現実世界がゲームフィールドになるリアルRPGクエストプラットフォームです。
    </div>

    <div class="guide-section">
      <div class="guide-section-title">◆ 楽しみ方 3ステップ</div>
      <div class="guide-steps">
        <div class="guide-step">
          <div class="guide-step-num">01</div>
          <div class="guide-step-title">クエストを選ぶ</div>
          <div class="guide-step-text">クエスト一覧から気になるクエストを見つけて受注。謎解き、宝探し、ボードゲームなど多彩なジャンルから選べます。</div>
        </div>
        <div class="guide-step">
          <div class="guide-step-num">02</div>
          <div class="guide-step-title">アイテムが届く</div>
          <div class="guide-step-text">受注後3〜5営業日で、物語の鍵となるアイテムが自宅に届きます。封を開ける瞬間から冒険が始まります。</div>
        </div>
        <div class="guide-step">
          <div class="guide-step-num">03</div>
          <div class="guide-step-title">冒険に出発</div>
          <div class="guide-step-text">届いたアイテムを使って謎を解き、物語を進めましょう。クリアしたらレビューを書いてコインをGET！</div>
        </div>
      </div>
    </div>

    <div class="guide-section">
      <div class="guide-section-title">◆ クエストの種類</div>
      <div class="guide-types">
        <div class="guide-type-card">
          <div class="guide-type-icon">🏠</div>
          <div class="guide-type-name">自宅完結型</div>
          <div class="guide-type-desc">届いたアイテムだけで全て完結。天候や時間を気にせず、自分のペースで挑戦できます。</div>
        </div>
        <div class="guide-type-card">
          <div class="guide-type-icon">🗺️</div>
          <div class="guide-type-name">現地型</div>
          <div class="guide-type-desc">実際の街や施設を舞台にした冒険。観光も兼ねて楽しめる、臨場感あふれるクエストです。</div>
        </div>
        <div class="guide-type-card">
          <div class="guide-type-icon">🔀</div>
          <div class="guide-type-name">ハイブリッド型</div>
          <div class="guide-type-desc">自宅での準備パートと現地での冒険パートを組み合わせた、二段構えのクエストです。</div>
        </div>
      </div>
    </div>

    <div class="guide-section">
      <div class="guide-section-title">◆ 称号システム</div>
      <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;margin-bottom:1rem;">
        クエストをクリアするたびに経験値が蓄積され、称号がランクアップします。
      </div>
      <div class="guide-types" style="grid-template-columns:repeat(4,1fr)">
        <div class="guide-type-card"><div class="guide-type-name" style="color:var(--text-dim)">見習い</div><div class="guide-type-desc">0クエスト〜</div></div>
        <div class="guide-type-card"><div class="guide-type-name" style="color:var(--neon-cyan)">冒険者</div><div class="guide-type-desc">2クエスト〜</div></div>
        <div class="guide-type-card"><div class="guide-type-name" style="color:var(--neon-gold)">勇者</div><div class="guide-type-desc">5クエスト〜</div></div>
        <div class="guide-type-card"><div class="guide-type-name" style="color:var(--accent-red)">賢者</div><div class="guide-type-desc">10クエスト〜</div></div>
      </div>
    </div>

    <div class="guide-section">
      <div class="guide-section-title">◆ よくある質問</div>
      <div class="faq-list">
        <div class="faq-item">
          <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
            <span>クエストの難易度はどのくらいですか？</span>
            <span class="faq-icon">▼</span>
          </button>
          <div class="faq-answer"><div class="faq-answer-inner">難易度は★1〜★3の3段階です。★1は初心者向けで、小学生高学年から楽しめます。★3は上級者向けで、複数人での挑戦を推奨しています。</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
            <span>所要時間はどのくらいですか？</span>
            <span class="faq-icon">▼</span>
          </button>
          <div class="faq-answer"><div class="faq-answer-inner">クエストによって異なりますが、1〜5時間程度です。各クエストの詳細ページに目安時間を記載しています。</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
            <span>返品はできますか？</span>
            <span class="faq-icon">▼</span>
          </button>
          <div class="faq-answer"><div class="faq-answer-inner">商品の性質上（謎解き・体験型コンテンツ）、開封後の返品はお受けできません。未開封の場合は商品到着後7日以内にご連絡ください。</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
            <span>コインはどうやって貯めますか？</span>
            <span class="faq-icon">▼</span>
          </button>
          <div class="faq-answer"><div class="faq-answer-inner">クエストのクリア報告やレビュー投稿でコインが獲得できます。貯めたコインはコイン交換所で特別アイテムと交換できます。</div></div>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-top:2rem;">
      <button class="btn-more" onclick="navigateTo('quest-board')" style="font-size:1rem;padding:0.8rem 2rem;">クエスト一覧を見る →</button>
    </div>
  `;
}

/* ── PAGE: REVIEWS (レビュー一覧) ── */
function renderReviewsPage() {
  const container = document.getElementById('reviews-content');
  if (!container) return;

  // Collect all reviews across quests
  const allReviews = [];
  quests.forEach(q => {
    (q.reviews || []).forEach(r => {
      allReviews.push({ ...r, questId: q.id, questTitle: q.title });
    });
  });
  allReviews.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  container.innerHTML = `
    <button class="subpage-back" onclick="navigateTo('quest-board')">← 掲示板に戻る</button>
    <div class="subpage-hero">
      <div class="subpage-hero-title">冒険者レビュー</div>
      <div class="subpage-hero-sub">— ADVENTURER REVIEWS —</div>
    </div>
    <div class="reviews-page-header">
      <div style="font-size:0.85rem;color:var(--text-dim);">全${allReviews.length}件のレビュー</div>
      <button class="review-guide-link" onclick="openReviewGuide()">レビューを書くには</button>
    </div>

    <!-- Review Guide Modal -->
    <div class="review-guide-modal" id="review-guide-modal" style="display:none">
      <div class="review-guide-inner">
        <button class="review-guide-close" onclick="closeReviewGuide()">✕</button>
        <h3 class="review-guide-title">クエストレビューの書き方</h3>
        <div class="review-guide-steps">
          <div class="review-guide-step">
            <span class="review-guide-num">01.</span>
            <div>会員登録をして<a href="#" onclick="event.preventDefault();closeReviewGuide();navigateTo('mypage')" style="color:var(--neon-gold);text-decoration:underline">ログイン</a></div>
          </div>
          <div class="review-guide-step">
            <span class="review-guide-num">02.</span>
            <div>レビューを書きたいクエストの詳細ページを開く</div>
          </div>
          <div class="review-guide-step">
            <span class="review-guide-num">03.</span>
            <div>レビュー欄の「レビューを書く」ボタンをクリック</div>
          </div>
          <div class="review-guide-step">
            <span class="review-guide-num">04.</span>
            <div>★評価・コメントを入力して「レビューを投稿する」で完了！</div>
          </div>
        </div>
        <button class="review-guide-close-btn" onclick="closeReviewGuide()">✕ 閉じる</button>
      </div>
    </div>
    <div class="reviews-page-list">
      ${allReviews.length ? allReviews.map(r => `
        <div class="review-card" onclick="openQuestDetail(${r.questId})" style="cursor:pointer">
          <div class="review-quest-bar">
            <span class="review-quest-bar-icon">◆</span>
            【${r.questTitle}】
          </div>
          <div class="review-card-body">
            <div class="review-card-header">
              <div class="review-user">
                <div class="review-user-avatar">${r.avatar}</div>
                <div class="review-user-info">
                  <div class="review-user-name">${r.user}</div>
                  <div class="review-user-rank">
                    <span class="review-user-title-badge">${r.title}</span>
                  </div>
                </div>
              </div>
              <div class="review-date">${r.date}</div>
            </div>
            <div class="review-stars-row">
              <div class="review-stars">${'★'.repeat(r.stars)}${'<span class="empty">★</span>'.repeat(5 - r.stars)}</div>
            </div>
            <div class="review-text">${r.text}</div>
          </div>
        </div>
      `).join('') : '<div class="empty-state"><div class="empty-state-text">まだレビューがありません</div></div>'}
    </div>
  `;
}

function openReviewGuide() {
  const modal = document.getElementById('review-guide-modal');
  if (modal) modal.style.display = 'flex';
}
function closeReviewGuide() {
  const modal = document.getElementById('review-guide-modal');
  if (modal) modal.style.display = 'none';
}

/* ── PAGE: COIN SHOP (コイン交換所) ── */
let coinItems = [
  { id: 1, name: '冒険者バッジ', description: 'プロフィールに表示される特別なバッジ。', cost: 500, icon: 'badge' },
  { id: 2, name: 'レアクエスト招待券', description: '限定クエストへの招待券。月1回の特別クエストに挑戦。', cost: 1200, icon: 'ticket' },
  { id: 3, name: '限定アバターフレーム', description: 'ゴールドの装飾フレームで差をつけよう。', cost: 800, icon: 'frame' },
  { id: 4, name: 'ギルドマスター称号', description: '「ギルドマスター」の称号をプロフィールに表示。', cost: 2000, icon: 'crown' },
];

async function loadCoinItems() {
  await safeSupabaseCall(async () => {
    const { data } = await db.from('coin_items').select('*').eq('is_available', true).order('cost');
    if (data?.length) coinItems = data;
  });
}

const coinIconSvgs = {
  badge: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
  ticket: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6"/></svg>',
  frame: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/></svg>',
  crown: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l3 12h14l3-12"/><path d="M3 16l-1 4h20l-1-4"/><path d="M8 12V8c0-2.2 1.8-4 4-4s4 1.8 4 4v4"/></svg>',
};

function renderCoinShopPage() {
  const container = document.getElementById('coin-shop-content');
  if (!container) return;

  container.innerHTML = `
    <button class="subpage-back" onclick="navigateTo('quest-board')">← 掲示板に戻る</button>
    <div class="subpage-hero">
      <div class="subpage-hero-title">コイン交換所</div>
      <div class="subpage-hero-sub">— COIN EXCHANGE —</div>
    </div>

    <div class="coin-balance-bar">
      <span>所持コイン：</span>
      <span class="coin-balance-num">${userState.coins.toLocaleString()}</span>
      <span>コイン</span>
    </div>

    <div class="coin-shop-page-grid">
      ${coinItems.map(item => `
        <div class="coin-shop-page-card">
          <div class="coin-shop-icon">${coinIconSvgs[item.icon] || coinIconSvgs.badge}</div>
          <div class="coin-shop-name">${item.name}</div>
          <div class="coin-shop-desc">${item.description}</div>
          <div class="coin-shop-cost">${item.cost.toLocaleString()}コイン</div>
          <button class="btn-exchange" onclick="exchangeCoinItem(${item.id}, ${item.cost})" ${userState.coins < item.cost ? 'disabled' : ''}>
            ${userState.coins >= item.cost ? '交換する' : 'コイン不足'}
          </button>
        </div>
      `).join('')}
    </div>

    <div class="coin-earn-section">
      <div class="coin-earn-title">◆ コインの貯め方</div>
      <div class="coin-earn-list">
        ・クエストをクリアする … 100〜500コイン<br>
        ・レビューを投稿する … 50コイン<br>
        ・友達を紹介する … 500コイン<br>
        ・キャンペーンに参加する … 随時
      </div>
    </div>
  `;
}

async function exchangeCoinItem(itemId, cost) {
  if (!userState.loggedIn) { showToast('ログインが必要です'); return; }
  if (userState.coins < cost) { showToast('コインが不足しています'); return; }

  const result = await safeSupabaseCall(async () => {
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('ログインが必要です');
    const { error } = await db.from('coin_exchanges').insert({ user_id: user.id, coin_item_id: itemId, cost });
    if (error) throw error;
    return true;
  });
  if (result === null) return;

  userState.coins -= cost;
  showToast('アイテムと交換しました！');
  renderCoinShopPage();
}

/* ── PAGE: NEWS (お知らせ) ── */
let newsData = [
  { id: 1, title: 'システムメンテナンスのお知らせ（3/5 深夜）', body: '3月5日 深夜2:00〜4:00の間、サーバーメンテナンスのためサービスが一時的にご利用いただけなくなります。', category: 'info', published_at: '2026-02-28' },
  { id: 2, title: '新クエスト「海底神殿の秘密」が追加されました', body: '待望の新クエスト「海底神殿の秘密」がクエスト一覧に追加されました！深海に沈んだ古代神殿の謎を解き明かす、A級難易度の本格派クエストです。', category: 'new', published_at: '2026-02-25' },
  { id: 3, title: '利用規約改定のお知らせ', body: '2026年3月1日より利用規約を一部改定いたします。主な変更点は返品・交換ポリシーの明確化です。', category: 'important', published_at: '2026-02-20' },
];

async function loadNews() {
  await safeSupabaseCall(async () => {
    const { data } = await db.from('news').select('*').order('published_at', { ascending: false });
    if (data?.length) newsData = data;
  });
}

let newsFilter = 'all';

function renderNewsPage() {
  const container = document.getElementById('news-content');
  if (!container) return;

  const catLabels = { info: 'お知らせ', new: '新着', important: '重要' };
  const catClasses = { info: 'cat-info', new: 'cat-new', important: 'cat-important' };
  const filtered = newsFilter === 'all' ? newsData : newsData.filter(n => n.category === newsFilter);

  container.innerHTML = `
    <button class="subpage-back" onclick="navigateTo('quest-board')">← 掲示板に戻る</button>
    <div class="subpage-hero">
      <div class="subpage-hero-title">お知らせ</div>
      <div class="subpage-hero-sub">— NEWS —</div>
    </div>

    <div class="news-tabs">
      <button class="news-tab ${newsFilter === 'all' ? 'active' : ''}" onclick="newsFilter='all'; renderNewsPage()">全て</button>
      <button class="news-tab ${newsFilter === 'info' ? 'active' : ''}" onclick="newsFilter='info'; renderNewsPage()">お知らせ</button>
      <button class="news-tab ${newsFilter === 'new' ? 'active' : ''}" onclick="newsFilter='new'; renderNewsPage()">新着</button>
      <button class="news-tab ${newsFilter === 'important' ? 'active' : ''}" onclick="newsFilter='important'; renderNewsPage()">重要</button>
    </div>

    <div class="news-page-list">
      ${filtered.map(n => `
        <div class="news-page-item" onclick="this.classList.toggle('expanded')">
          <div class="news-page-item-meta">
            <span class="news-date">${(n.published_at || '').slice(0, 10).replace(/-/g, '.')}</span>
            <span class="news-cat ${catClasses[n.category] || 'cat-info'}">${catLabels[n.category] || n.category}</span>
          </div>
          <div class="news-page-item-body">
            <div class="news-page-item-title">${n.title}</div>
            <div class="news-detail-body">${n.body || ''}</div>
          </div>
        </div>
      `).join('')}
      ${!filtered.length ? '<div class="empty-state"><div class="empty-state-text">お知らせはありません</div></div>' : ''}
    </div>
  `;
}

/* ── PAGE: CAMPAIGNS (キャンペーン) ── */
let campaignsData = [
  { id: 1, title: '春の冒険キャンペーン！全クエスト20%OFF', body: '春の訪れを記念して、全クエストが20%OFFになるキャンペーンを開催中！クーポンコード：SPRING2026', category: 'active', start_date: '2026-03-01', end_date: '2026-03-31' },
  { id: 2, title: 'ゴールデンウィーク特別クエスト予約開始', body: 'GW限定の特別クエスト「失われた黄金郷」の予約を受け付けます。現地型の大規模クエストで、最大10人パーティで挑戦可能。', category: 'preview', start_date: '2026-04-29', end_date: '2026-05-06' },
  { id: 3, title: '友達紹介で500コインプレゼント', body: '友達をリアクエに招待すると、あなたと友達の両方に500コインをプレゼント！', category: 'active', start_date: '2026-02-10', end_date: '2026-04-30' },
];

async function loadCampaigns() {
  await safeSupabaseCall(async () => {
    const { data } = await db.from('campaigns').select('*').order('created_at', { ascending: false });
    if (data?.length) campaignsData = data;
  });
}

let campaignFilter = 'all';

function renderCampaignsPage() {
  const container = document.getElementById('campaigns-content');
  if (!container) return;

  const catLabels = { active: '開催中', preview: '予告', ended: '終了' };
  const catClasses = { active: 'cat-active', preview: 'cat-preview', ended: 'cat-ended' };
  const filtered = campaignFilter === 'all' ? campaignsData : campaignsData.filter(c => c.category === campaignFilter);

  container.innerHTML = `
    <button class="subpage-back" onclick="navigateTo('quest-board')">← 掲示板に戻る</button>
    <div class="subpage-hero">
      <div class="subpage-hero-title">キャンペーン</div>
      <div class="subpage-hero-sub">— CAMPAIGNS —</div>
    </div>

    <div class="news-tabs">
      <button class="news-tab ${campaignFilter === 'all' ? 'active' : ''}" onclick="campaignFilter='all'; renderCampaignsPage()">全て</button>
      <button class="news-tab ${campaignFilter === 'active' ? 'active' : ''}" onclick="campaignFilter='active'; renderCampaignsPage()">開催中</button>
      <button class="news-tab ${campaignFilter === 'preview' ? 'active' : ''}" onclick="campaignFilter='preview'; renderCampaignsPage()">予告</button>
      <button class="news-tab ${campaignFilter === 'ended' ? 'active' : ''}" onclick="campaignFilter='ended'; renderCampaignsPage()">終了</button>
    </div>

    <div class="news-page-list">
      ${filtered.map(c => `
        <div class="news-page-item" onclick="this.classList.toggle('expanded')">
          <div class="news-page-item-meta">
            <span class="news-cat ${catClasses[c.category] || 'cat-active'}">${catLabels[c.category] || c.category}</span>
          </div>
          <div class="news-page-item-body">
            <div class="news-page-item-title">${c.title}</div>
            <div class="campaign-dates">${c.start_date ? c.start_date.replace(/-/g, '.') : ''} 〜 ${c.end_date ? c.end_date.replace(/-/g, '.') : ''}</div>
            <div class="news-detail-body">${c.body || ''}</div>
          </div>
        </div>
      `).join('')}
      ${!filtered.length ? '<div class="empty-state"><div class="empty-state-text">キャンペーンはありません</div></div>' : ''}
    </div>
  `;
}

/* ── PAGE: CONTACT (お問い合わせ) ── */
let contactType = 'general';

function renderContactPage() {
  const container = document.getElementById('contact-content');
  if (!container) return;

  container.innerHTML = `
    <button class="subpage-back" onclick="navigateTo('quest-board')">← 掲示板に戻る</button>
    <div class="subpage-hero">
      <div class="subpage-hero-title">お問い合わせ</div>
      <div class="subpage-hero-sub">— CONTACT —</div>
    </div>

    <div class="contact-tabs">
      <button class="contact-tab ${contactType === 'general' ? 'active' : ''}" onclick="contactType='general'; renderContactPage()">一般</button>
      <button class="contact-tab ${contactType === 'business' ? 'active' : ''}" onclick="contactType='business'; renderContactPage()">法人</button>
    </div>

    <form class="contact-form" onsubmit="submitContact(event)">
      <div class="contact-field">
        <label>お名前 *</label>
        <input type="text" id="contact-name" required placeholder="ギルドマスター太郎">
      </div>
      <div class="contact-field">
        <label>メールアドレス *</label>
        <input type="email" id="contact-email" required placeholder="adventurer@example.com">
      </div>
      ${contactType === 'business' ? `
        <div class="contact-field">
          <label>法人名 *</label>
          <input type="text" id="contact-company" required placeholder="株式会社ギルド">
        </div>
      ` : ''}
      <div class="contact-field">
        <label>カテゴリ *</label>
        <select id="contact-category" required>
          <option value="">選択してください</option>
          <option value="quest">クエストについて</option>
          <option value="order">注文・配送について</option>
          <option value="account">アカウントについて</option>
          ${contactType === 'business' ? '<option value="event">企業向けイベント</option><option value="collaboration">コラボレーション</option>' : ''}
          <option value="other">その他</option>
        </select>
      </div>
      <div class="contact-field">
        <label>お問い合わせ内容 *</label>
        <textarea id="contact-message" required placeholder="お問い合わせ内容を入力してください..."></textarea>
      </div>
      <button type="submit" class="btn-submit-contact" id="contact-submit-btn">送信する</button>
    </form>
  `;
}

async function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const category = document.getElementById('contact-category').value;
  const message = document.getElementById('contact-message').value.trim();
  const btn = document.getElementById('contact-submit-btn');
  btn.disabled = true;

  const result = await safeSupabaseCall(async () => {
    const { error } = await db.from('contact_submissions').insert({
      name, email, category, message, contact_type: contactType,
    });
    if (error) throw error;
    return true;
  });
  if (result === null) { btn.disabled = false; return; }

  showToast('お問い合わせを受け付けました。ありがとうございます！');
  // Reset form
  setTimeout(() => {
    renderContactPage();
  }, 1000);
  trackEvent('submit_contact', { contact_type: contactType, category });
}

/* ── LEGAL PAGES ── */
function renderLegalPage(type) {
  const content = {
    terms: `<h1>利用規約</h1>
      <p>最終更新日: 2026年3月1日</p>
      <h2>第1条（適用）</h2><p>本規約は、リアクエ REAL QUEST（以下「本サービス」）の利用に関する条件を定めるものです。</p>
      <h2>第2条（利用登録）</h2><p>登録希望者が当方の定める方法により利用登録を申請し、当方がこれを承認することにより利用登録が完了するものとします。</p>
      <h2>第3条（禁止事項）</h2><p>ユーザーは以下の行為をしてはなりません。<br>・法令または公序良俗に違反する行為<br>・犯罪行為に関連する行為<br>・本サービスの内容等を不正に利用する行為<br>・他のユーザーに関する個人情報等を収集する行為<br>・ネタバレ等、他のユーザーの体験を損なう行為</p>
      <h2>第4条（商品の配送）</h2><p>クエスト商品は受注後3〜5営業日以内に発送いたします。配送状況はマイページよりご確認いただけます。</p>
      <button class="btn-outline" onclick="navigateTo('quest-board')" style="margin-top:2rem">← トップに戻る</button>`,
    privacy: `<h1>プライバシーポリシー</h1>
      <p>最終更新日: 2026年3月1日</p>
      <h2>1. 収集する情報</h2><p>メールアドレス、表示名、お届け先住所（購入時）、決済情報（Shopify経由）。</p>
      <h2>2. 利用目的</h2><p>サービスの提供・運営、商品の発送、お問い合わせ対応、サービス改善のための分析。</p>
      <h2>3. 第三者提供</h2><p>法令に基づく場合を除き、お客様の同意なく第三者に個人情報を提供することはありません。決済処理はShopify Inc.が行います。</p>
      <h2>4. データの保管</h2><p>お客様のデータはSupabase（AWS東京リージョン）に暗号化して保管されます。</p>
      <button class="btn-outline" onclick="navigateTo('quest-board')" style="margin-top:2rem">← トップに戻る</button>`,
    tokushoho: `<h1>特定商取引法に基づく表記</h1>
      <table class="legal-table">
        <tr><th>販売業者</th><td>Cloud Illusion合同会社</td></tr>
        <tr><th>運営統括責任者</th><td>大隅直人</td></tr>
        <tr><th>所在地</th><td>〒561-0832 大阪府豊中市庄内西町3-1-5 サンパティオビル4階</td></tr>
        <tr><th>電話番号</th><td>06-4400-0361</td></tr>
        <tr><th>メールアドレス</th><td>info@c-ill.com</td></tr>
        <tr><th>URL</th><td>https://moedesu1.github.io/realquest/</td></tr>
        <tr><th>商品の名称</th><td>体験型クエスト商品（物語アイテム一式）</td></tr>
        <tr><th>販売価格</th><td>各商品ページに税込価格で表示</td></tr>
        <tr><th>商品代金以外の必要料金</th><td>なし（税込・送料込）</td></tr>
        <tr><th>お支払い方法</th><td>クレジットカード決済（Shopify Payments経由）</td></tr>
        <tr><th>お支払い時期</th><td>注文確定時に決済</td></tr>
        <tr><th>商品の引渡し時期</th><td>注文確定後3〜5営業日以内に発送</td></tr>
        <tr><th>返品・交換</th><td>謎解き商品の特性上、開封後の返品不可。未開封品は到着後7日以内にご連絡いただいた場合に限り対応。不良品の場合は送料当社負担で交換。</td></tr>
        <tr><th>返品送料</th><td>お客様都合の場合はお客様負担、不良品の場合は当社負担</td></tr>
      </table>
      <button class="btn-outline" onclick="navigateTo('quest-board')" style="margin-top:2rem">← トップに戻る</button>`,
  };

  const el = document.getElementById(`${type}-content`);
  if (el) el.innerHTML = content[type] || '';
}

/* ── MOBILE MENU ── */
function openMobileMenu() { document.getElementById('mobile-menu').classList.add('open'); }
function closeMobileMenu() { document.getElementById('mobile-menu').classList.remove('open'); }

/* ── AUDIO / BGM SYSTEM ── */
let audioContext = null;
let isPlaying = false;
let bgmInterval = null;

function startBGM() {
  if (isPlaying) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    isPlaying = true;
    updateAudioButtons();
    scheduleBGMLoop();
  } catch (e) {}
}

function scheduleBGMLoop() {
  if (!isPlaying || !audioContext) return;
  const ctx = audioContext;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.06;
  master.connect(ctx.destination);

  const chords = [
    [261.63, 329.63, 392.00],
    [293.66, 369.99, 440.00],
    [246.94, 311.13, 369.99],
    [261.63, 329.63, 392.00],
  ];

  const chordDur = 4;
  chords.forEach((chord, ci) => {
    chord.forEach(freq => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = now + ci * chordDur;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.3, t + 0.5);
      env.gain.setValueAtTime(0.3, t + chordDur - 0.5);
      env.gain.linearRampToValueAtTime(0, t + chordDur);
      osc.connect(env); env.connect(master);
      osc.start(t); osc.stop(t + chordDur);
    });
    const melodyFreqs = [523.25, 587.33, 493.88, 523.25];
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = melodyFreqs[ci];
    const t = now + ci * chordDur + 1;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.15, t + 0.2);
    env.gain.exponentialRampToValueAtTime(0.01, t + 2);
    osc.connect(env); env.connect(master);
    osc.start(t); osc.stop(t + 2.5);
  });

  const totalDur = chords.length * chordDur;
  bgmInterval = setTimeout(() => scheduleBGMLoop(), totalDur * 1000);
}

function stopBGM() {
  isPlaying = false;
  if (bgmInterval) clearTimeout(bgmInterval);
  bgmInterval = null;
  updateAudioButtons();
}

function toggleAudio() { if (isPlaying) stopBGM(); else startBGM(); }

function updateAudioButtons() {
  document.querySelectorAll('.audio-toggle').forEach(btn => btn.classList.toggle('playing', isPlaying));
}

/* ── SFX ── */
function playStartSFX() {
  try {
    const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    audioContext = ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(ctx.destination);
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0.4, now + i * 0.08);
      env.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
      osc.connect(env); env.connect(gain);
      osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.3);
    });
  } catch (e) {}
}

/* ── PARTICLE CANVAS ── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const count = 40;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.3 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${p.a})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── DB: LOAD QUESTS ── */
async function loadQuests() {
  if (!db) return;
  try {
    const { data, error } = await db
      .from('quests')
      .select('*, quest_items(*)')
      .eq('is_published', true)
      .order('id');
    if (error || !data?.length) return;

    // Load reviews with profile info
    let reviewsData = [];
    try {
      const { data: rv } = await db
        .from('reviews')
        .select('*, profiles(display_name, avatar_char, title, quests_accepted)')
        .order('created_at', { ascending: false });
      if (rv) reviewsData = rv;
    } catch (e) { /* reviews will be empty */ }

    // Group reviews by quest_id
    const reviewsByQuest = {};
    reviewsData.forEach(r => {
      if (!reviewsByQuest[r.quest_id]) reviewsByQuest[r.quest_id] = [];
      reviewsByQuest[r.quest_id].push({
        id: r.id,
        user: r.profiles?.display_name || '冒険者',
        title: r.profiles?.title || '見習い',
        avatar: r.profiles?.avatar_char || '冒',
        level: (r.profiles?.quests_accepted || 0) * 5,
        rank: '?',
        stars: r.rating,
        date: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10).replace(/-/g, '.') : '',
        text: r.text,
        sub: r.sub_ratings || {},
        likes: r.likes_count || 0,
        userId: r.user_id,
      });
    });

    quests = data.map(q => ({
      id: q.id,
      title: q.title,
      tagline: q.tagline,
      rank: q.rank,
      difficulty: q.difficulty,
      price: q.price,
      category: q.category || 'beginner',
      format: q.format || 'home',
      genre: q.genre || '',
      subGenre: q.sub_genre || '',
      isNew: q.is_new || false,
      image: q.image_url || `images/quest-${q.id}-alchemy.webp`,
      estimatedTime: q.estimated_time || '—',
      players: q.players || '—',
      region: q.region || '自宅完結',
      items: (q.quest_items || []).sort((a, b) => a.sort_order - b.sort_order).map(it => ({ icon: it.icon || '◆', name: it.name })),
      prologue: q.prologue || '',
      cautions: q.cautions || [],
      purposes: q.purposes || [],
      reviews: reviewsByQuest[q.id]?.length ? reviewsByQuest[q.id] : (fallbackQuests.find(fb => fb.id === q.id)?.reviews || []),
      reviewAvg: parseFloat(q.review_avg) || 0,
      reviewCount: q.review_count || 0,
      salesCount: q.sales_count || 0,
      shopifyVariantId: q.shopify_variant_id,
    }));
  } catch (e) { /* use fallback data */ }
}

/* ── INIT ── */
(async function init() {
  // Load favorites & avatar from localStorage
  try { userState.favorites = JSON.parse(localStorage.getItem('rq_favorites')) || []; } catch(e) {}

  // Try loading data from DB
  await loadQuests();
  loadNews();
  loadCampaigns();
  loadCoinItems();

  // Check existing session
  if (db) {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      userState.loggedIn = true;
      userState.role = 'adventurer';
      // Read name directly from session (always available, no DB needed)
      if (session.user.user_metadata?.display_name) {
        userState.name = session.user.user_metadata.display_name;
      }
      await loadUserProfile(session.user.id);
      updateHeaderUser();
      navigateTo('quest-board', {
        transition: false,
        onShow: () => { renderHomeBoard(); updateHeaderUser(); }
      });
      startBGM();
    }
  }

  // Header search bar → sync to search input and trigger
  // Header search — event delegation for all pages (duplicate IDs)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target && e.target.id === 'header-search-input') {
      const query = e.target.value.trim();
      if (!query) return;
      // Navigate to quest-board if not already there
      if (currentPage !== 'quest-board') {
        navigateTo('quest-board', {
          transition: false,
          onShow: () => {
            renderHomeBoard();
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = query;
            applyDropdownFilters();
            const section = document.getElementById('home-search');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      } else {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = query;
        applyDropdownFilters();
        const section = document.getElementById('home-search');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // Init Shopify
  initShopify();

  // GA4 dynamic init
  if (RQ_CONFIG.GA4_ID && RQ_CONFIG.GA4_ID !== 'G-XXXXXXXXXX') {
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${RQ_CONFIG.GA4_ID}`;
    s.async = true;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', RQ_CONFIG.GA4_ID);
  }
})();
