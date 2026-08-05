const LIFF_ID = "2010931633-3uzRGseS";
const LOG_ENDPOINT = "https://script.google.com/macros/s/AKfycbyirD-1iBPuaiR7rVhMT7NUeF6pGZbLlzJxNgSL-qjzzuRakrOEn8ygfnm9Sv4agYo7KQ/exec";

// 楽天アフィリエイト検索リンク
const RAKUTEN_AFF = "https://hb.afl.rakuten.co.jp/hgc/0f41feae.fb92208b.0f41feaf.5965d44d/?pc=";
function rakutenLink(q) {
  return RAKUTEN_AFF + encodeURIComponent("https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(q) + "/");
}

// platform: Bluetooth MIDIはiOSアプリのみ対応（Androidアプリ・WEBは有線のみ）
const DEVICES = {
  "iphone-lightning": { label: "iPhone（Lightning端子）", port: "lightning", platform: "ios" },
  "iphone-usbc":      { label: "iPhone（USB-C端子）",     port: "usbc",      platform: "ios" },
  "ipad-usbc":        { label: "iPad（USB-C端子）",       port: "usbc",      platform: "ios" },
  "ipad-lightning":   { label: "iPad（Lightning端子）",   port: "lightning", platform: "ios" },
  "android":          { label: "Android",                 port: "usbc",      platform: "android" },
  "pc-usba":          { label: "パソコン（USB-A端子）",   port: "usba",      platform: "web" },
  "pc-usbc":          { label: "パソコン（USB-C端子）",   port: "usbc",      platform: "web" },
};

const MAKER_ORDER = ["YAMAHA", "CASIO", "Roland", "KORG", "KAWAI"];

const PORT_LABEL = {
  "USB-B":   "USB Type-B（四角い形・プリンタと同じ）",
  "micro-B": "USB micro-B（小さい台形）",
  "mini-B":  "USB mini-B（小さい六角形）",
  "USB-C":   "USB Type-C（楕円形）",
};

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
let state = { device: null, keyboard: null, methodSummary: "" };
let liffReady = false;

// ---------- 初期化 ----------

document.addEventListener("DOMContentLoaded", async () => {
  initLiff();
  try {
    const res = await fetch("data/keyboards.json");
    const json = await res.json();
    db = json.keyboards || [];
  } catch (e) {
    db = [];
  }
  renderMakers();
  renderRecommended();
  bindEvents();
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

// ---------- イベント ----------

function bindEvents() {
  const agreeCheck = document.getElementById("agree-check");
  const agreeBtn = document.getElementById("agree-btn");
  agreeCheck.addEventListener("change", () => { agreeBtn.disabled = !agreeCheck.checked; });
  agreeBtn.addEventListener("click", () => {
    localStorage.setItem("disclaimerAccepted", "1");
    hide("disclaimer-overlay");
    logEvent("disclaimer_accept");
  });

  document.querySelectorAll("#device-choices .choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.device = DEVICES[btn.dataset.device];
      document.querySelectorAll("#device-choices .choice").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      show("step-keyboard");
      document.getElementById("step-keyboard").scrollIntoView({ behavior: "smooth" });
      if (state.keyboard) renderResult();
      logEvent("device_select", { device: state.device.label });
    });
  });

  document.getElementById("model-search").addEventListener("input", renderModelResults);
  document.getElementById("restart-btn").addEventListener("click", () => location.reload());
  document.getElementById("consult-btn").addEventListener("click", sendConsult);
  document.getElementById("no-keyboard-btn").addEventListener("click", () => {
    const box = document.getElementById("recommend-box");
    box.classList.toggle("hidden");
    if (!box.classList.contains("hidden")) {
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      logEvent("recommend_open");
    }
  });
}

// ---------- 鍵盤をこれから買う方へ ----------

function renderRecommended() {
  const box = document.getElementById("recommend-list");
  box.innerHTML = RECOMMENDED.map((r) => `
    <div class="rec-item">
      <p class="rec-use">${escapeHtml(r.use)}</p>
      <p class="rec-model">${escapeHtml(r.model)}</p>
      <p class="rec-spec">${escapeHtml(r.keys)}／${escapeHtml(r.port)}／目安 ${escapeHtml(r.price)}</p>
      <a class="buy-link" href="${rakutenLink(r.q)}" target="_blank" rel="noopener">楽天で探す ▸</a>
    </div>`).join("");
}

// ---------- STEP 2: 鍵盤 ----------

function renderMakers() {
  const makersInDb = [...new Set(db.map((k) => k.maker))];
  const makers = [...MAKER_ORDER.filter((m) => makersInDb.includes(m)),
                  ...makersInDb.filter((m) => !MAKER_ORDER.includes(m))];
  const area = document.getElementById("maker-choices");
  area.innerHTML = "";
  makers.forEach((maker) => {
    const btn = document.createElement("button");
    btn.className = "choice maker";
    btn.textContent = maker;
    btn.addEventListener("click", () => {
      state.maker = maker;
      document.querySelectorAll("#maker-choices .choice").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      show("model-search-area");
      const input = document.getElementById("model-search");
      input.value = "";
      renderModelResults();
      input.focus();
      logEvent("maker_select", { maker });
    });
    area.appendChild(btn);
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
  const q = normalize(document.getElementById("model-search").value.trim());
  const list = document.getElementById("model-results");
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
    li.innerHTML = '<img src="images/chara-thinking.png" alt=""><span>見つかりません。機種名の表記をご確認いただくか、トークで直接ご相談ください。</span>';
    list.appendChild(li);
    if (notFoundLogged !== q) {
      notFoundLogged = q;
      logEvent("model_not_found", { maker: state.maker, query: document.getElementById("model-search").value.trim() });
    }
  }
}

// ---------- STEP 3: 結果 ----------

function selectKeyboard(kb) {
  state.keyboard = kb;
  renderResult();
  show("step-result");
  document.getElementById("step-result").scrollIntoView({ behavior: "smooth" });
  logEvent("keyboard_select", { maker: kb.maker, model: kb.model, device: state.device ? state.device.label : "" });
}

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

function renderResult() {
  const kb = state.keyboard;
  const dev = state.device;
  const card = document.getElementById("result-card");
  const parts = [];
  const summaries = [];

  parts.push(`
    <div class="result-head">
      <p class="kb-name">🎹 ${escapeHtml(kb.maker)} ${escapeHtml(kb.model)}</p>
      <p class="dev-name">📱 ${escapeHtml(dev.label)}</p>
    </div>`);

  // 61鍵未満はレッスンが成立しない
  if (kb.keys && kb.keys < 61) {
    parts.push(`
      <div class="method alert-method">
        <h3>⚠️ この機種はレッスンに使えません</h3>
        <p class="item-note">Jazz-Stepsのレッスンは<b>61鍵以上</b>を前提に作られています。この機種は${kb.keys}鍵のため、演奏範囲が足りず一部レッスンが成立しません。下の「鍵盤をこれから買う方へ」もご覧ください。</p>
      </div>`);
  }

  const hasUsb = kb.usb_to_host && kb.usb_port_type && CABLE_PLANS[dev.port] && CABLE_PLANS[dev.port][kb.usb_port_type];
  // USB接続はできるが端子形状が未確認の機種（Alesis Melody 61 MK4 等）。
  // 「接続できない」と誤って案内しないよう、形状をユーザーに選んでもらう。
  const usbPortUnknown = kb.usb_to_host && !kb.usb_port_type;
  const hasDin = kb.midi_din;
  // Bluetooth MIDIはiOSアプリのみ対応（Androidアプリ・パソコンは有線のみ）
  const btUsable = kb.bluetooth_midi && dev.platform === "ios";

  // 有線USB
  if (hasUsb) {
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 USBケーブルで接続<span class="method-tag">いちばん確実</span></h3>
        <p class="port-line">鍵盤側の端子：<b>${PORT_LABEL[kb.usb_port_type] || escapeHtml(kb.usb_port_type)}</b></p>
        ${planBlock(CABLE_PLANS[dev.port][kb.usb_port_type])}
        <p class="to-host-note">⚠️ 鍵盤にUSB端子が2つある機種は挿し間違いにご注意ください。USBメモリ用の「TO DEVICE」端子ではなく、<b>「USB TO HOST」端子</b>に接続します。</p>
        <p class="item-note">つなぐ順番：鍵盤の電源を入れる → ケーブルを接続 → アプリを起動（MIDI機器は自動で検知されます）${dev.platform === "web" ? "<br>※ パソコンは<b>Chrome</b>をお使いください。またピアノを接続した<b>あとに画面を再読み込み</b>してください。" : ""}${dev.platform === "android" ? "<br>※ Android側はOTG（USBホスト機能）対応が必要です（近年のほとんどの機種は対応）。" : ""}</p>
      </div>`);
    summaries.push(`USB接続（鍵盤側:${kb.usb_port_type}）`);
  }

  // USB対応だが端子形状が未確認 → 形状を選んでもらう
  if (usbPortUnknown) {
    const opts = Object.keys(CABLE_PLANS[dev.port]).map((p) =>
      `<button class="port-pick" data-port="${p}">${escapeHtml(PORT_LABEL[p] || p)}</button>`).join("");
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 USBケーブルで接続<span class="method-tag">この機種の接続方法</span></h3>
        <p class="item-note">この機種は<b>USB接続に対応しています</b>が、公開情報では端子の形状までは確認できませんでした。お手元の鍵盤の端子を見て、下から近いものを選んでください。必要なケーブルをご案内します。</p>
        <div class="port-picks">${opts}</div>
        <div id="port-result"></div>
      </div>`);
    summaries.push("USB接続（端子形状は要確認）");
  }

  // 丸型MIDI（USBが使えないときの手段）
  if (hasDin && !hasUsb && !usbPortUnknown) {
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 丸型MIDI端子（5ピン）で接続<span class="method-tag">この機種の接続方法</span></h3>
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
        <p class="item-note">USB端子・MIDI端子が確認できませんでした。Jazz-Stepsのトレーニングには<b>MIDI接続（USB Type-BまたはMIDI端子）</b>が必要です。下のボタンからご相談いただくか、「鍵盤をこれから買う方へ」もご覧ください。</p>
      </div>`);
    summaries.push("接続手段が確認できず");
  }

  // 共通の注意
  parts.push(`
    <div class="common-note">
      <p><b>接続時の共通の注意</b></p>
      <ul>
        <li>USBハブを経由せず、<b>直接つないで</b>ください（ハブ経由で不安定になる例があります）</li>
        <li>有線とBluetoothの<b>同時接続はしない</b>でください（入力が二重になります）</li>
        <li>ケーブルは<b>データ通信対応</b>のものを。充電専用ケーブルではMIDI信号が流れません</li>
      </ul>
    </div>`);

  // トラブルシューティング
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

  state.methodSummary = summaries.join(" / ");
  card.innerHTML = parts.join("");

  card.querySelectorAll(".port-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      card.querySelectorAll(".port-pick").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      const p = btn.dataset.port;
      document.getElementById("port-result").innerHTML = planBlock(CABLE_PLANS[dev.port][p]);
      logEvent("port_pick", { maker: kb.maker, model: kb.model, device: dev.label, note: p });
    });
  });

  logEvent("result_show", { maker: kb.maker, model: kb.model, device: dev.label, summary: state.methodSummary });
}

// ---------- 相談送信 ----------

async function sendConsult() {
  const kb = state.keyboard;
  const note = document.getElementById("consult-note").value.trim();
  const lines = [
    "【機器接続サポートからの相談】",
    `端末: ${state.device.label}`,
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

function show(id) { document.getElementById(id).classList.remove("hidden"); }
function hide(id) { document.getElementById(id).classList.add("hidden"); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
