const LIFF_ID = "2010931633-3uzRGseS";
const LOG_ENDPOINT = "https://script.google.com/macros/s/AKfycbyirD-1iBPuaiR7rVhMT7NUeF6pGZbLlzJxNgSL-qjzzuRakrOEn8ygfnm9Sv4agYo7KQ/exec";

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

let db = [];
let state = { device: null, maker: null, keyboard: null, port: null, methodSummary: "" };
let liffReady = false;

// ---------- 初期化 ----------

document.addEventListener("DOMContentLoaded", async () => {
  initLiff();
  try {
    // 機種DBはCSS/JSと違い、アプリを更新せずデータだけ差し替えることが多い。
    // ?v=方式だと更新のたびに手で番号を上げる必要があり、上げ忘れると
    // 再訪ユーザーが古いDBを掴んだままになる（実際に取りこぼしかけた）。
    // no-cacheでETag再検証を強制する。変化がなければ304なので転送量はほぼゼロ。
    const res = await fetch("data/keyboards.json", { cache: "no-cache" });
    const json = await res.json();
    db = json.keyboards || [];
  } catch (e) {
    db = [];
  }
  bindGlobal();
  renderStrip();
  goStep("device");
});

// LINEアプリ内でのみ利用可。LINE外からのアクセスはゲート画面で弾く。
// 完全な防御ではなく実用上のガード（静的サイトのため偽装は技術的に可能）。
// 動作確認用に ?preview=1 でバイパスできる。
async function initLiff() {
  const bypass = new URLSearchParams(location.search).has("preview");
  try {
    await liff.init({ liffId: LIFF_ID });
    liffReady = true;
    if (liff.isInClient() || bypass) showApp();
    else showGate();
  } catch (e) {
    if (bypass) showApp();
    else showGate();
  }
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("gate").classList.add("hidden");
  if (!localStorage.getItem("disclaimerAccepted")) show("disclaimer-overlay");
}

function showGate() {
  document.getElementById("gate").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

// ---------- 利用ログ ----------

// ?preview=1 は開発者用のバイパス。検証アクセスが利用実績に混ざると
// デイリーレポートの数字が歪むため、preview時はログを送らない。
const IS_PREVIEW = new URLSearchParams(location.search).has("preview");

function logEvent(type, data = {}) {
  if (!LOG_ENDPOINT || IS_PREVIEW) return;
  try {
    const payload = JSON.stringify(Object.assign({ type }, data));
    fetch(LOG_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: payload }).catch(() => {});
  } catch (e) { /* ログ失敗は無視 */ }
}

function bindGlobal() {
  const agreeCheck = document.getElementById("agree-check");
  const agreeBtn = document.getElementById("agree-btn");
  agreeCheck.addEventListener("change", () => { agreeBtn.disabled = !agreeCheck.checked; });
  agreeBtn.addEventListener("click", () => {
    localStorage.setItem("disclaimerAccepted", "1");
    hide("disclaimer-overlay");
    logEvent("disclaimer_accept");
  });

  // 埋まったスロットをタップすると、その質問に戻れる
  document.getElementById("slot-device").addEventListener("click", () => goStep("device"));
  document.getElementById("slot-kb").addEventListener("click", () => goStep("keyboard"));
  const toPort = () => { if (state.device && state.keyboard) goStep(needsPortPick() ? "port" : "result"); };
  document.getElementById("plug-l").addEventListener("click", toPort);
  document.getElementById("plug-r").addEventListener("click", toPort);

  window.addEventListener("resize", positionTail);
}

// ---------- 完成図（サマリー帯） ----------

// 鍵盤側の端子形状。DBに無ければユーザーが選んだ値を使う。
function kbPort() {
  if (!state.keyboard) return null;
  return state.keyboard.usb_port_type || state.port;
}

// DBに端子形状が無く、かつUSB接続はできる機種はユーザーに形を選んでもらう
function needsPortPick() {
  const kb = state.keyboard;
  return !!(kb && kb.usb_to_host && !kb.usb_port_type && !state.port);
}

function renderStrip() {
  const dev = state.device;
  const kb = state.keyboard;

  // デバイス側
  const dSlot = document.getElementById("slot-device");
  dSlot.classList.toggle("filled", !!dev);
  dSlot.querySelector(".slot-badge").textContent = dev ? "✓" : "1";
  dSlot.querySelector(".slot-art").innerHTML = dev ? ART[dev.art] : ART.q;
  dSlot.querySelector(".slot-label").textContent = dev ? dev.label : "デバイス";

  // ピアノ側
  const kSlot = document.getElementById("slot-kb");
  kSlot.classList.toggle("filled", !!kb);
  kSlot.querySelector(".slot-badge").textContent = kb ? "✓" : "2";
  kSlot.querySelector(".slot-art").innerHTML = kb ? ART.piano : ART.q;
  kSlot.querySelector(".slot-label").textContent = kb ? kb.model : "ピアノ";

  // ケーブルの両端コネクタ
  const pl = document.getElementById("plug-l");
  const pr = document.getElementById("plug-r");
  if (dev) {
    pl.innerHTML = plugArt(dev.port) + `<span class="plug-cap">${DEV_PORT_SHORT[dev.port]}</span>`;
    pl.classList.add("known");
  } else {
    pl.innerHTML = '<span class="plug-q">?</span>';
    pl.classList.remove("known");
  }
  const kp = kbPort();
  if (kp && (PLUG_IMG[kp] || PLUG_ART[kp])) {
    pr.innerHTML = plugArt(kp) + `<span class="plug-cap">${PORT_SHORT[kp] || kp}</span>`;
    pr.classList.add("known");
  } else {
    pr.innerHTML = '<span class="plug-q">?</span>';
    pr.classList.remove("known");
  }
  document.getElementById("cable").classList.toggle("done", !!(dev && kp));
}

// 吹き出しの尻尾を、今答えている対象の真下に移動させる
function positionTail() {
  const target = document.querySelector("#strip .aiming");
  const panel = document.getElementById("panel");
  if (!target || !panel) return;
  const t = target.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const x = t.left + t.width / 2 - p.left;
  panel.style.setProperty("--tail-x", Math.round(x) + "px");
}

function aimAt(id) {
  document.querySelectorAll("#strip .aiming").forEach((el) => el.classList.remove("aiming"));
  const el = document.getElementById(id);
  if (el) el.classList.add("aiming");
}

// ---------- 質問パネル ----------

function goStep(step) {
  const body = document.getElementById("panel-body");
  const panel = document.getElementById("panel");
  panel.classList.remove("wide");
  if (step === "device") { aimAt("slot-device"); body.innerHTML = devicePanel(); bindDevicePanel(); }
  else if (step === "keyboard") { aimAt("slot-kb"); body.innerHTML = keyboardPanel(); bindKeyboardPanel(); }
  else if (step === "port") { aimAt("plug-r"); body.innerHTML = portPanel(); bindPortPanel(); }
  else if (step === "result") { aimAt("cable"); panel.classList.add("wide"); body.innerHTML = resultPanel(); bindResultPanel(); }
  // 尻尾は同期で合わせる。requestAnimationFrame任せにすると、タブが非表示の間など
  // コールバックが遅延したときに前の位置のまま取り残される。
  // 遅延分は、画像の読み込みでスロット幅が変わったときの追従用。
  positionTail();
  setTimeout(positionTail, 320);
  // 選択確定のたびにページ先頭へ戻す（下にスクロールしたままだと完成図の帯が
  // 見えず気持ち悪い、との中川さんフィードバック 2026-08-11）
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- 1. デバイス ---

function devicePanel() {
  const items = DEVICE_ORDER.map((k) => {
    const d = DEVICES[k];
    const sel = state.device === d ? " selected" : "";
    return `<button class="choice${sel}" data-device="${k}">
        <span class="choice-art">${ART[d.art]}</span>
        <span class="txt">${escapeHtml(d.label)}<small>${escapeHtml(d.sub)}</small></span>
        <span class="choice-plug">${plugArt(d.port)}</span>
      </button>`;
  }).join("");
  return `
    <h2><img class="h-img" src="images/h-step1.png?v=2" alt="お使いのスマホ・タブレット・パソコンは？"></h2>
    <p class="hint">右のアイコンは<strong>充電ケーブルの先端の形</strong>です。お手持ちのケーブルと見比べてください。</p>
    <div class="choices">${items}</div>
    <p class="hint">💡 iPhone/iPadは充電口の形で見分けられます。金属の板がむき出しなのがLightning、楕円の筒型なのがUSB-Cです。</p>`;
}

function bindDevicePanel() {
  document.querySelectorAll("#panel-body .choice[data-device]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.device = DEVICES[btn.dataset.device];
      renderStrip();
      logEvent("device_select", { device: state.device.label + "（" + state.device.sub + "）" });
      if (state.keyboard) goStep(needsPortPick() ? "port" : "result");
      else goStep("keyboard");
    });
  });
}

// --- 2. ピアノ ---

function keyboardPanel() {
  const makersInDb = [...new Set(db.map((k) => k.maker))];
  const makers = [...MAKER_ORDER.filter((m) => makersInDb.includes(m)),
                  ...makersInDb.filter((m) => !MAKER_ORDER.includes(m))];
  const chips = makers.map((m) =>
    `<button class="choice maker${state.maker === m ? " selected" : ""}" data-maker="${escapeHtml(m)}">${escapeHtml(m)}</button>`).join("");
  const recs = RECOMMENDED.map((r) => `
    <div class="rec-item">
      <p class="rec-use">${escapeHtml(r.use)}</p>
      <p class="rec-model">${escapeHtml(r.model)}</p>
      <p class="rec-spec">${escapeHtml(r.keys)}／${escapeHtml(r.port)}／目安 ${escapeHtml(r.price)}</p>
      <a class="buy-link" href="${rakutenLink(r.q)}" target="_blank" rel="noopener">楽天で探す ▸</a>
    </div>`).join("");
  return `
    <h2><img class="h-img" src="images/h-step2.png?v=2" alt="お使いのキーボード・電子ピアノは？"></h2>
    <p class="hint">メーカーを選んで機種名を検索してください。機種名は本体の右上や背面のシールに書かれています。</p>
    <div class="choices maker-choices">${chips}</div>
    <div id="model-search-area" class="${state.maker ? "" : "hidden"}">
      <input type="text" id="model-search" placeholder="機種名を入力（例: P-125, CT-S300）" autocomplete="off">
      <ul id="model-results"></ul>
    </div>
    <button class="link-btn" id="no-keyboard-btn">鍵盤をこれから買う方はこちら</button>
    <div id="recommend-box" class="hidden">
      <p class="rec-lead">Jazz-Stepsのレッスンには <b>61鍵以上</b> と <b>MIDI接続（USB Type-B または MIDI端子）</b> が必要です。この条件を満たすおすすめ機種です。</p>
      ${recs}
      <p class="rec-caution">⚠️ 購入時は<b>USB端子の種類（Type-B / Type-C）</b>を必ずご確認ください。ここを間違えるとケーブルの買い直しになります。<br>⚠️「Bluetooth対応」と書かれていても、音楽再生用の<b>Bluetoothオーディオ</b>だけで<b>Bluetooth MIDIは非対応</b>の機種があります。仕様表に「Bluetooth MIDI」と明記されているかをご確認ください。</p>
    </div>`;
}

function bindKeyboardPanel() {
  document.querySelectorAll("#panel-body .choice[data-maker]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.maker = btn.dataset.maker;
      document.querySelectorAll("#panel-body .choice[data-maker]").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      show("model-search-area");
      const input = document.getElementById("model-search");
      input.value = "";
      renderModelResults();
      input.focus();
      logEvent("maker_select", { maker: state.maker });
    });
  });
  const input = document.getElementById("model-search");
  if (input) input.addEventListener("input", renderModelResults);
  if (state.maker) renderModelResults();
  document.getElementById("no-keyboard-btn").addEventListener("click", () => {
    const box = document.getElementById("recommend-box");
    box.classList.toggle("hidden");
    if (!box.classList.contains("hidden")) {
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      logEvent("recommend_open");
    }
  });
}

// 全角英数字も検索できるように正規化する（「ｋｍ」で引けない事例があったため）
function normalize(s) {
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[‐‑‒–—―ー－]/g, "-")
    .toLowerCase()
    .replace(/[-\s]/g, "");
}

let notFoundLogged = "";
function renderModelResults() {
  const field = document.getElementById("model-search");
  const list = document.getElementById("model-results");
  if (!field || !list) return;
  const raw = field.value.trim();
  const q = normalize(raw);
  list.innerHTML = "";
  const candidates = db
    .filter((k) => k.maker === state.maker)
    .filter((k) => !q || normalize(k.model).includes(q))
    .slice(0, 12);
  candidates.forEach((k) => {
    const li = document.createElement("li");
    li.innerHTML = `${escapeHtml(k.model)}<small>${escapeHtml(k.series || "")}</small>`;
    li.addEventListener("click", () => selectKeyboard(k));
    list.appendChild(li);
  });
  if (candidates.length === 0 && q) {
    const li = document.createElement("li");
    li.className = "not-found";
    li.innerHTML = '<img src="images/chara-photo.png?v=1" alt=""><span>見つかりません。機種名の表記をご確認いただくか、トークで直接ご相談ください。</span>';
    list.appendChild(li);
    if (notFoundLogged !== q) {
      notFoundLogged = q;
      logEvent("model_not_found", { maker: state.maker, query: raw });
    }
  }
}

function selectKeyboard(kb) {
  state.keyboard = kb;
  state.port = null;
  renderStrip();
  logEvent("keyboard_select", { maker: kb.maker, model: kb.model, device: state.device ? state.device.label : "" });
  goStep(needsPortPick() ? "port" : "result");
}

// --- 2.5. 端子の形（DBに無い機種のみ） ---

function portPanel() {
  const opts = Object.keys(CABLE_PLANS[state.device.port]).map((p) =>
    `<button class="choice port-pick" data-port="${p}">
       <span class="choice-art plug-art">${plugArt(p)}</span>
       <span class="txt">${escapeHtml(PORT_SHORT[p] || p)}<small>${escapeHtml((PORT_LABEL[p] || "").replace(/^[^（]*（|）$/g, ""))}</small></span>
     </button>`).join("");
  return `
    <h2 class="txt-head">鍵盤側の端子はどの形ですか？</h2>
    <p class="hint">この機種は<b>USB接続に対応しています</b>が、公開情報では端子の形状までは確認できませんでした。お手元の鍵盤の差込口を見て、近いものを選んでください。</p>
    <div class="choices">${opts}</div>
    <p class="hint">💡 端子は鍵盤の背面か底面にあります。「USB TO HOST」と書かれた差込口です。</p>`;
}

function bindPortPanel() {
  document.querySelectorAll("#panel-body .port-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.port = btn.dataset.port;
      renderStrip();
      logEvent("port_pick", { maker: state.keyboard.maker, model: state.keyboard.model, device: state.device.label, note: state.port });
      goStep("result");
    });
  });
}

// --- 3. 結果 ---

function planLabel(i) { return "購入プラン" + String.fromCharCode(65 + i); }

function buyItem(it) {
  const link = it.q ? `<a class="buy-link" href="${rakutenLink(it.q)}" target="_blank" rel="noopener">楽天で探す ▸</a>` : "";
  return `<li><span class="buy-name">🛒 ${escapeHtml(it.t)}</span>${link}</li>`;
}

function planBlock(plans) {
  return plans.map((p, i) => `
    <div class="plan ${i === 0 ? "rec" : ""}">
      <div class="plan-head">${planLabel(i)}${i === 0 && plans.length > 1 ? '<span class="rec-badge">おすすめ</span>' : ""}</div>
      <ul class="buy-list">${p.items.map((it) => buyItem(it)).join("")}</ul>
      ${p.note ? `<p class="plan-note">${escapeHtml(p.note)}</p>` : ""}
    </div>`).join("");
}

function resultPanel() {
  const kb = state.keyboard;
  const dev = state.device;
  const parts = [];
  const summaries = [];
  const port = kbPort();

  const hasUsb = kb.usb_to_host && port && CABLE_PLANS[dev.port] && CABLE_PLANS[dev.port][port];
  const hasDin = kb.midi_din;
  // Bluetooth MIDIはiOSアプリのみ対応（Androidアプリ・パソコンは有線のみ）
  const btUsable = kb.bluetooth_midi && dev.platform === "ios";

  parts.push('<h2><img class="h-img" src="images/h-step3.png?v=2" alt="接続方法"></h2>');

  // 61鍵未満はレッスンが成立しない
  if (kb.keys && kb.keys < 61) {
    parts.push(`
      <div class="method alert-method">
        <h3>⚠️ この機種はレッスンに使えません</h3>
        <p class="item-note">Jazz-Stepsのレッスンは<b>61鍵以上</b>を前提に作られています。この機種は${kb.keys}鍵のため、演奏範囲が足りず一部レッスンが成立しません。「鍵盤をこれから買う方はこちら」もご覧ください。</p>
      </div>`);
  }

  // 有線USB（結論＝買うべきケーブル）
  if (hasUsb) {
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 このケーブルでつなげます<span class="method-tag">いちばん確実</span></h3>
        <p class="port-line">鍵盤側の端子：<b>${PORT_LABEL[port] || escapeHtml(port)}</b>${state.port ? "（お選びいただいた形）" : ""}</p>
        ${planBlock(CABLE_PLANS[dev.port][port])}
        <p class="to-host-note">⚠️ 鍵盤にUSB端子が2つある機種は挿し間違いにご注意ください。USBメモリ用の「TO DEVICE」端子ではなく、<b>「USB TO HOST」端子</b>に接続します。</p>
        <p class="item-note">つなぐ順番：鍵盤の電源を入れる → ケーブルを接続 → アプリを起動（MIDI機器は自動で検知されます）${dev.platform === "web" ? "<br>※ パソコンは<b>Chrome</b>をお使いください。またピアノを接続した<b>あとに画面を再読み込み</b>してください。" : ""}${dev.platform === "android" ? "<br>※ Android側はOTG（USBホスト機能）対応が必要です（近年のほとんどの機種は対応）。" : ""}</p>
      </div>`);
    summaries.push(`USB接続（鍵盤側:${port}）`);
  }

  // 丸型MIDI（USBが使えないときの手段）
  if (hasDin && !hasUsb) {
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 丸型MIDI端子（5ピン）でつなげます<span class="method-tag">この機種の接続方法</span></h3>
        ${planBlock(DIN_PLANS[dev.port])}
        <p class="to-host-note">⚠️ <b>挿す向きに注意</b>。ピアノ側の「MIDI OUT」に、ケーブル側の「MIDI IN」を挿します。逆向きだと信号が流れません。</p>
      </div>`);
    summaries.push("丸型MIDI接続");
  } else if (hasDin && hasUsb) {
    parts.push(`
      <div class="method sub-method">
        <h3>🔌 丸型MIDI端子（5ピン）でも接続できます<span class="method-tag sub">USBが使えないとき</span></h3>
        ${planBlock(DIN_PLANS[dev.port])}
        <p class="to-host-note">⚠️ ピアノ側の「MIDI OUT」に、ケーブル側の「MIDI IN」を挿します（向き注意）。</p>
      </div>`);
  }

  // USBオーディオ機能付き機種：つなぐと端末から音が出なくなる（仕様・正常）
  if (hasUsb && kb.usb_audio) {
    parts.push(`
      <div class="method info-method">
        <h3>ℹ️ つなぐとスマホ・PCから音が出なくなります（正常です）</h3>
        <p class="item-note">この機種はUSBケーブル1本で音の信号もやり取りするため、接続すると<b>音の出口がピアノ本体側に切り替わります</b>。故障ではありません。<br><b>ピアノ本体の音量を上げ、本体のスピーカー（またはピアノのヘッドホン端子）で聴いてください。</b>ヘッドホン端子に何か挿さっていないかもご確認ください。<br>採点・クリア判定は鍵盤の信号だけで行うので、音の出口が変わっても<b>正常に判定されます</b>。ケーブルを抜けば元に戻ります。</p>
      </div>`);
  }

  // Bluetooth
  if (kb.bluetooth_midi) {
    if (btUsable) {
      parts.push(`
        <div class="method bt-method">
          <h3>📶 Bluetooth MIDIも使えます<span class="method-tag sub">iPhone・iPadのみ</span></h3>
          <p class="item-note">ケーブル不要ですが、わずかな遅延が出るため、演奏の反応が気になる場合は有線をおすすめします。<br><b>有線とBluetoothの同時接続はしないでください</b>（入力が二重になり、押していない音が判定されることがあります）。</p>
        </div>`);
      summaries.push("Bluetooth MIDI対応（iOS）");
    } else {
      parts.push(`
        <div class="method sub-method">
          <h3>📶 Bluetooth MIDIは今回は使えません</h3>
          <p class="item-note">この鍵盤はBluetooth MIDIに対応していますが、<b>Jazz-StepsのBluetooth接続はiPhone・iPadのアプリのみ対応</b>です。${dev.platform === "android" ? "Androidアプリ" : "パソコン（ブラウザ）"}は有線接続のみとなります。</p>
        </div>`);
    }
  }

  // 接続手段なし
  if (summaries.length === 0) {
    parts.push(`
      <div class="method alert-method">
        <h3>⚠️ この機種はJazz-Stepsに接続できない可能性があります</h3>
        <p class="item-note">USB端子・MIDI端子が確認できませんでした。Jazz-Stepsのトレーニングには<b>MIDI接続（USB Type-BまたはMIDI端子）</b>が必要です。下のボタンからご相談いただくか、ひとつ前の画面の「鍵盤をこれから買う方はこちら」もご覧ください。</p>
      </div>`);
    summaries.push("接続手段が確認できず");
  }

  // 共通の注意（結論を邪魔しないよう畳んでおく）
  parts.push(`
    <details class="common-note">
      <summary>接続時の共通の注意</summary>
      <ul>
        <li>USBハブを経由せず、<b>直接つないで</b>ください（ハブ経由で不安定になる例があります）</li>
        <li>有線とBluetoothの<b>同時接続はしない</b>でください（入力が二重になります）</li>
        <li>ケーブルは<b>データ通信対応</b>のものを。充電専用ケーブルではMIDI信号が流れません</li>
      </ul>
    </details>`);

  parts.push(`
    <details class="trouble">
      <summary>🔧 つないでも認識されないときは</summary>
      <ol>
        <li>ケーブルを繋いだまま、アプリ（またはブラウザ）を<b>完全に終了して開き直す</b></li>
        <li>設定画面（歯車）でMIDI機器が接続されているか確認する</li>
        <li>アプリを最新版に更新して、ケーブルを抜き差しする</li>
        <li>端末を再起動する</li>
        <li>ケーブルの緩み・断線、充電専用ケーブルでないかを確認する</li>
        <li>GarageBandなど他のMIDIアプリで認識されるか試す（他でも認識されないなら端末かケーブル側の問題です）</li>
      </ol>
      ${dev.platform === "web" ? `<p class="item-note"><b>パソコンの場合</b>：Chromeをお使いください。認識しないときは <code>chrome://settings/content/midiDevices</code> の「許可しないサイト」にJazz-Stepsが入っていないか確認を。音が出ないときはピアノ接続後に画面を再読み込みしてください。</p>` : ""}
      <p class="item-note"><b>弾いた音と違う音が判定される・音域がずれる場合</b>は、まずピアノ本体の<b>オクターブ調整・トランスポーズ（移調）が0になっているか</b>を確認してください。「昨日まで普通に使えていたのに急にずれた」ときは、ほぼこれが原因です。</p>
    </details>`);

  if (kb.notes) {
    parts.push(`<details class="kb-notes"><summary>この機種の補足情報</summary><p>${escapeHtml(kb.notes)}</p></details>`);
  }

  // 相談
  parts.push(`
    <div class="consult-area">
      <div class="consult-chara">
        <img src="images/chara-photo.png?v=1" alt="中川の写真">
        <p class="bubble">うまくいかないときや不安なときは、そのまま気軽に相談してください！確認してお返事します。</p>
      </div>
      <textarea id="consult-note" placeholder="（任意）困っている内容があれば入力してください　例: ケーブルをつないだが音が出ない"></textarea>
      <button id="consult-btn" class="primary-btn"><img class="h-img" src="images/h-cta.png?v=2" alt="この内容でトークに相談する"></button>
    </div>
    <button class="link-btn" id="restart-btn">最初からやり直す</button>`);

  state.methodSummary = summaries.join(" / ");
  logEvent("result_show", { maker: kb.maker, model: kb.model, device: dev.label, summary: state.methodSummary });
  return parts.join("");
}

function bindResultPanel() {
  document.getElementById("consult-btn").addEventListener("click", sendConsult);
  document.getElementById("restart-btn").addEventListener("click", () => location.reload());
}

// ---------- 相談送信 ----------

async function sendConsult() {
  const kb = state.keyboard;
  const note = document.getElementById("consult-note").value.trim();
  const lines = [
    "【機器接続サポートからの相談】",
    `端末: ${state.device.label}（${state.device.sub}）`,
    `鍵盤: ${kb.maker} ${kb.model}`,
    `案内した接続方法: ${state.methodSummary}`,
  ];
  if (note) lines.push(`相談内容: ${note}`);
  logEvent("consult_send", { maker: kb.maker, model: kb.model, device: state.device.label, note });
  await sendToTalk(lines.join("\n"));
}

async function sendToTalk(text) {
  if (!liffReady || !liff.isInClient()) {
    alert("LINEアプリのトーク画面から開くと送信できます。\nお手数ですが、この内容をコピーしてトークに貼り付けてください：\n\n" + text);
    return;
  }
  try {
    await liff.sendMessages([{ type: "text", text }]);
    alert("トークに送信しました。返信をお待ちください。");
    liff.closeWindow();
  } catch (e) {
    alert("送信できませんでした。トーク画面に戻って直接ご相談ください。");
  }
}

// ---------- util ----------

function show(id) { const e = document.getElementById(id); if (e) e.classList.remove("hidden"); }
function hide(id) { const e = document.getElementById(id); if (e) e.classList.add("hidden"); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
