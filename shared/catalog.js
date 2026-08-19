// ============================================================
// shared/catalog.js — 「事実」の共有カタログ
//
// 既存版（index.html/app.js）とアカデミー版（academy.html/academy.js）の
// 両方から読み込まれる。ここに置くのは機種・ケーブル・端子の事実データと
// 純粋関数だけ。フロー・文言・画面（=会話）はそれぞれの app に置く。
// 修正するときは両方の画面で表示確認すること。
// ============================================================

// 楽天アフィリエイト検索リンク
const RAKUTEN_AFF = "https://hb.afl.rakuten.co.jp/hgc/0f41feae.fb92208b.0f41feaf.5965d44d/?pc=";
function rakutenLink(q) {
  return RAKUTEN_AFF + encodeURIComponent("https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(q) + "/");
}

// ---------- イラスト（外部依存を増やさないためインラインSVG） ----------

const ART = {
  phone: '<svg viewBox="0 0 48 64" aria-hidden="true"><rect x="9" y="2" width="30" height="60" rx="6" class="s-body"/><rect x="13" y="8" width="22" height="44" rx="2" class="s-screen"/><circle cx="24" cy="57" r="2.4" class="s-dot"/></svg>',
  tablet: '<svg viewBox="0 0 56 64" aria-hidden="true"><rect x="5" y="3" width="46" height="58" rx="5" class="s-body"/><rect x="10" y="9" width="36" height="43" rx="2" class="s-screen"/><circle cx="28" cy="56" r="2.2" class="s-dot"/></svg>',
  laptop: '<svg viewBox="0 0 72 56" aria-hidden="true"><rect x="11" y="5" width="50" height="34" rx="3" class="s-body"/><rect x="15" y="9" width="42" height="26" class="s-screen"/><path d="M3 45h66l-4 6H7z" class="s-body"/></svg>',
  piano: '<svg viewBox="0 0 84 48" aria-hidden="true"><rect x="2" y="4" width="80" height="40" rx="3" class="s-body"/><rect x="2" y="4" width="80" height="8" rx="3" class="s-cap"/><g class="s-line"><path d="M14 13v30M25 13v30M36 13v30M47 13v30M58 13v30M69 13v30"/></g><g class="s-dot"><rect x="10" y="13" width="7" height="17" rx="1"/><rect x="21" y="13" width="7" height="17" rx="1"/><rect x="43" y="13" width="7" height="17" rx="1"/><rect x="54" y="13" width="7" height="17" rx="1"/><rect x="65" y="13" width="7" height="17" rx="1"/></g></svg>',
  // ヘッドホン（アカデミー版の「音」スロット用）
  ear: '<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M10 34v-6a18 18 0 0 1 36 0v6" fill="none" stroke-width="4" class="s-arc"/><rect x="6" y="32" width="10" height="16" rx="4" class="s-body"/><rect x="40" y="32" width="10" height="16" rx="4" class="s-body"/></svg>',
  q: '<svg viewBox="0 0 48 48" aria-hidden="true"><text x="24" y="34" text-anchor="middle" class="s-q">?</text></svg>',
};

// 端子の形（コネクタ）のイラスト
const PLUG_ART = {
  lightning: '<svg viewBox="0 0 34 24" aria-hidden="true"><rect x="8" y="9" width="18" height="6" rx="1.5" class="s-dot"/><path d="M17 15v6" class="s-line"/></svg>',
  usbc:      '<svg viewBox="0 0 34 24" aria-hidden="true"><rect x="6" y="8" width="22" height="8" rx="4" class="s-body"/><path d="M17 16v5" class="s-line"/></svg>',
  usba:      '<svg viewBox="0 0 34 24" aria-hidden="true"><rect x="6" y="6" width="22" height="11" rx="1.5" class="s-body"/><rect x="9" y="9" width="16" height="3" rx="1" class="s-dot"/><path d="M17 17v4" class="s-line"/></svg>',
  "USB-B":   '<svg viewBox="0 0 34 24" aria-hidden="true"><path d="M9 18v-7l3.5-4h9l3.5 4v7z" class="s-body"/><path d="M17 18v4" class="s-line"/></svg>',
  "micro-B": '<svg viewBox="0 0 34 24" aria-hidden="true"><path d="M9 9h16v5l-2.5 3h-11L9 14z" class="s-body"/><path d="M17 17v5" class="s-line"/></svg>',
  "mini-B":  '<svg viewBox="0 0 34 24" aria-hidden="true"><path d="M8 8h18v6l-3 3H11l-3-3z" class="s-body"/><path d="M17 17v5" class="s-line"/></svg>',
  "USB-C":   '<svg viewBox="0 0 34 24" aria-hidden="true"><rect x="6" y="8" width="22" height="8" rx="4" class="s-body"/><path d="M17 16v5" class="s-line"/></svg>',
};

// 以前作成したコネクタのイラスト画像（あればSVGより優先して使う。
// 簡略SVGは「わかりづらい」と中川さんフィードバックがあったため 2026-08-11）
const PLUG_IMG = {
  lightning: "illust-lightning.png",
  usbc:      "illust-usbc.png",
  usba:      "illust-usba.png",
  "USB-C":   "illust-usbc.png",
};
function plugArt(p) {
  return PLUG_IMG[p]
    ? `<img class="plug-img" src="images/${PLUG_IMG[p]}?v=2" alt="">`
    : (PLUG_ART[p] || "");
}

// platform: Bluetooth MIDIはiOSアプリのみ対応（Androidアプリ・WEBは有線のみ）
const DEVICES = {
  "iphone-lightning": { label: "iPhone", sub: "Lightning端子（14以前）", port: "lightning", platform: "ios",     art: "phone" },
  "iphone-usbc":      { label: "iPhone", sub: "USB-C端子（15以降）",     port: "usbc",      platform: "ios",     art: "phone" },
  "ipad-usbc":        { label: "iPad",   sub: "USB-C端子",               port: "usbc",      platform: "ios",     art: "tablet" },
  "ipad-lightning":   { label: "iPad",   sub: "Lightning端子",           port: "lightning", platform: "ios",     art: "tablet" },
  "android":          { label: "Android", sub: "スマホ・タブレット",     port: "usbc",      platform: "android", art: "phone" },
  "pc-usba":          { label: "パソコン", sub: "USB-A端子（四角）",     port: "usba",      platform: "web",     art: "laptop" },
  "pc-usbc":          { label: "パソコン", sub: "USB-C端子のみ",         port: "usbc",      platform: "web",     art: "laptop" },
};

const DEVICE_ORDER = ["iphone-lightning", "iphone-usbc", "ipad-usbc", "ipad-lightning", "android", "pc-usba", "pc-usbc"];

const MAKER_ORDER = ["YAMAHA", "CASIO", "Roland", "KORG", "KAWAI"];

const PORT_LABEL = {
  "USB-B":   "USB Type-B（四角い形・プリンタと同じ）",
  "micro-B": "USB micro-B（小さい台形）",
  "mini-B":  "USB mini-B（小さい六角形）",
  "USB-C":   "USB Type-C（楕円形）",
};
const PORT_SHORT = { "USB-B": "Type-B", "micro-B": "micro-B", "mini-B": "mini-B", "USB-C": "Type-C" };
const DEV_PORT_SHORT = { lightning: "Lightning", usbc: "Type-C", usba: "Type-A" };

// 端末側の端子 × 鍵盤側の端子 → 購入プラン（先頭がおすすめ）
// items: t=表示名, q=楽天検索ワード（省略時は購入リンクなし＝手持ち品）
const CABLE_PLANS = {
  lightning: {
    "USB-B": [
      { items: [{ t: "USB Type-B → Lightning ケーブル 1本", q: "USB TypeB Lightning MIDI ケーブル" }], note: "ケーブル1本で完結します。迷ったらこちら。" },
      { items: [{ t: "Apple Lightning - USB 3カメラアダプタ", q: "Apple Lightning USB 3 カメラアダプタ" }, { t: "USB A-Bケーブル（プリンタ用と同じ）", q: "USB A-B ケーブル プリンタ" }], note: "プリンタ用ケーブルが家にあるなら、アダプタだけ買う手もあります。" },
    ],
    "micro-B": [
      { items: [{ t: "Apple Lightning - USB 3カメラアダプタ", q: "Apple Lightning USB 3 カメラアダプタ" }, { t: "USB A - micro Bケーブル（データ通信対応）", q: "USB microB ケーブル データ通信" }] },
    ],
    "mini-B": [
      { items: [{ t: "Apple Lightning - USB 3カメラアダプタ", q: "Apple Lightning USB 3 カメラアダプタ" }, { t: "USB A - mini Bケーブル", q: "USB miniB ケーブル" }] },
    ],
    "USB-C": [
      { items: [{ t: "Apple Lightning - USB 3カメラアダプタ", q: "Apple Lightning USB 3 カメラアダプタ" }, { t: "USB A - Cケーブル（データ通信対応）", q: "USB-C USB-A ケーブル データ通信" }] },
    ],
  },
  usbc: {
    "USB-B": [
      { items: [{ t: "USB Type-B → Type-C ケーブル 1本", q: "USB TypeB TypeC MIDI ケーブル" }], note: "ケーブル1本で完結します。迷ったらこちら。" },
      { items: [{ t: "手持ちのUSB A-Bケーブル（プリンタ用）" }, { t: "USB変換アダプタ（A→C・OTG対応）", q: "USB 変換アダプタ A to C OTG" }], note: "プリンタ用ケーブルが家にあるなら、変換アダプタだけ買えばOK。" },
    ],
    "micro-B": [
      { items: [{ t: "USB Type-C → micro B ケーブル（データ通信対応） 1本", q: "USB-C microB ケーブル データ通信" }], note: "ケーブル1本で完結します。" },
      { items: [{ t: "手持ちのUSB A - micro Bケーブル（データ通信対応）" }, { t: "USB変換アダプタ（A→C・OTG対応）", q: "USB 変換アダプタ A to C OTG" }] },
    ],
    "mini-B": [
      { items: [{ t: "USB Type-C → mini B ケーブル 1本", q: "USB-C miniB ケーブル" }], note: "ケーブル1本で完結します。" },
      { items: [{ t: "手持ちのUSB A - mini Bケーブル" }, { t: "USB変換アダプタ（A→C・OTG対応）", q: "USB 変換アダプタ A to C OTG" }] },
    ],
    "USB-C": [
      { items: [{ t: "USB Type-C → Type-C ケーブル（データ通信対応） 1本", q: "USB-C USB-C ケーブル データ通信 OTG" }], note: "充電専用ケーブルはMIDI信号を通しません。「データ通信対応」の表記があるものを選んでください。" },
    ],
  },
  usba: {
    "USB-B":   [{ items: [{ t: "USB A-Bケーブル（プリンタ用と同じ） 1本", q: "USB A-B ケーブル プリンタ" }] }],
    "micro-B": [{ items: [{ t: "USB A - micro Bケーブル（データ通信対応） 1本", q: "USB microB ケーブル データ通信" }] }],
    "mini-B":  [{ items: [{ t: "USB A - mini Bケーブル 1本", q: "USB miniB ケーブル" }] }],
    "USB-C":   [{ items: [{ t: "USB A - Type-C ケーブル（データ通信対応） 1本", q: "USB-C USB-A ケーブル データ通信" }] }],
  },
};

// 丸型MIDI（5ピンDIN）接続の購入プラン
const DIN_PLANS = {
  lightning: [
    { items: [{ t: "MIDI → USB Type-A 変換ケーブル", q: "MIDI USB 変換ケーブル" }, { t: "USB Type-A → Lightning 変換アダプタ", q: "Apple Lightning USB 3 カメラアダプタ" }], note: "2点必要です。" },
  ],
  usbc: [
    { items: [{ t: "MIDI → USB Type-C ケーブル 1本", q: "MIDI USB TypeC 変換ケーブル" }], note: "ケーブル1本で完結します。" },
  ],
  usba: [
    { items: [{ t: "MIDI → USB Type-A 変換ケーブル 1本", q: "MIDI USB 変換ケーブル" }] },
  ],
};

// 鍵盤が無い方への推奨機種（高田さん監修）
const RECOMMENDED = [
  { use: "とにかく安く始めたい", model: "Alesis Melody 61 MK4", keys: "61鍵", price: "8,000〜9,000円", port: "USB Type-B", q: "Alesis Melody 61 MK4" },
  { use: "88鍵で省スペース", model: "PLAYTECH PFK88", keys: "88鍵（折りたたみ）", price: "25,000円前後", port: "USB Type-C", q: "PLAYTECH PFK88" },
  { use: "本格的に長く続ける", model: "CASIO CDP-S105BK", keys: "88鍵（ハンマーアクション）", price: "35,000円前後", port: "USB Type-B", q: "CASIO CDP-S105" },
];

// ---------- 共有の純粋関数 ----------

// 全角英数字も検索できるように正規化する（「ｋｍ」で引けない事例があったため）
function normalize(s) {
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[‐‑‒–—―ー－]/g, "-")
    .toLowerCase()
    .replace(/[-\s]/g, "");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function show(id) { const e = document.getElementById(id); if (e) e.classList.remove("hidden"); }
function hide(id) { const e = document.getElementById(id); if (e) e.classList.add("hidden"); }

// 機種DBの読み込み。
// ?v=方式だと更新のたびに手で番号を上げる必要があり、上げ忘れると
// 再訪ユーザーが古いDBを掴んだままになる（実際に取りこぼしかけた）。
// no-cacheでETag再検証を強制する。変化がなければ304なので転送量はほぼゼロ。
async function loadKeyboardDb() {
  try {
    const res = await fetch("data/keyboards.json", { cache: "no-cache" });
    const json = await res.json();
    return json.keyboards || [];
  } catch (e) {
    return [];
  }
}
