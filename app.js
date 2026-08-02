const LIFF_ID = "2010931633-3uzRGseS";
const LOG_ENDPOINT = ""; // GAS WebアプリのURL（未設定なら送信しない）

const DEVICES = {
  "iphone-lightning": { label: "iPhone（Lightning端子）", port: "lightning" },
  "iphone-usbc":      { label: "iPhone（USB-C端子）",     port: "usbc" },
  "ipad-usbc":        { label: "iPad（USB-C端子）",       port: "usbc" },
  "ipad-lightning":   { label: "iPad（Lightning端子）",   port: "lightning" },
  "android":          { label: "Android",                 port: "usbc" },
  "pc-usba":          { label: "パソコン（USB-A端子）",   port: "usba" },
  "pc-usbc":          { label: "パソコン（USB-C端子）",   port: "usbc" },
};

const MAKER_ORDER = ["YAMAHA", "CASIO", "Roland", "KORG", "KAWAI"];

const PORT_LABEL = {
  "USB-B":   "USB-B（四角い形・プリンタと同じ）",
  "micro-B": "USB micro-B（小さい台形）",
  "mini-B":  "USB mini-B（小さい六角形）",
  "USB-C":   "USB-C（楕円形）",
};

// 端末側の端子 × 鍵盤側の端子 → 購入プラン（先頭がおすすめ）
const CABLE_PLANS = {
  lightning: {
    "USB-B": [
      { items: ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A-Bケーブル（プリンタ用と同じ）"] },
    ],
    "micro-B": [
      { items: ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A - micro Bケーブル（データ通信対応）"] },
    ],
    "mini-B": [
      { items: ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A - mini Bケーブル"] },
    ],
    "USB-C": [
      { items: ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A - Cケーブル（データ通信対応）"] },
    ],
  },
  usbc: {
    "USB-B": [
      { items: ["USB-C → USB-Bケーブル 1本"], note: "ケーブル1本で完結。迷ったらこちら。" },
      { items: ["手持ちのUSB A-Bケーブル（プリンタ用）", "USB変換アダプタ（A→C）"], note: "プリンタ用ケーブルが家にあるなら、変換アダプタだけ買えばOK。" },
    ],
    "micro-B": [
      { items: ["USB-C → micro Bケーブル（データ通信対応） 1本"], note: "ケーブル1本で完結。" },
      { items: ["手持ちのUSB A - micro Bケーブル（データ通信対応）", "USB変換アダプタ（A→C）"], note: "昔のAndroid充電ケーブル等が使える場合があります（データ通信対応のもの）。" },
    ],
    "mini-B": [
      { items: ["USB-C → mini Bケーブル 1本"], note: "ケーブル1本で完結。" },
      { items: ["手持ちのUSB A - mini Bケーブル", "USB変換アダプタ（A→C）"] },
    ],
    "USB-C": [
      { items: ["USB-C → USB-Cケーブル（データ通信対応） 1本"], note: "「データ通信対応」の表記があるものを選んでください（充電専用は不可）。" },
    ],
  },
  usba: {
    "USB-B":   [{ items: ["USB A-Bケーブル（プリンタ用と同じ） 1本"] }],
    "micro-B": [{ items: ["USB A - micro Bケーブル（データ通信対応） 1本"] }],
    "mini-B":  [{ items: ["USB A - mini Bケーブル 1本"] }],
    "USB-C":   [{ items: ["USB A - Cケーブル（データ通信対応） 1本"] }],
  },
};

// MIDI DIN接続時に端末側で追加で必要になるもの
const DIN_ADAPTER = {
  lightning: "Apple Lightning - USB 3カメラアダプタ（純正推奨）",
  usbc: "USB変換アダプタ（A→C・インターフェースがUSB-Aの場合）",
  usba: null,
};

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
    if (liff.isInClient() || bypass) {
      showApp();
    } else {
      showGate();
    }
  } catch (e) {
    if (bypass) showApp();
    else showGate();
  }
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("gate").classList.add("hidden");
  if (!localStorage.getItem("disclaimerAccepted")) {
    show("disclaimer-overlay");
  }
}

function showGate() {
  document.getElementById("gate").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

// ---------- 利用ログ ----------

function logEvent(type, data = {}) {
  if (!LOG_ENDPOINT) return;
  try {
    const payload = JSON.stringify(Object.assign({ type }, data));
    fetch(LOG_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: payload }).catch(() => {});
  } catch (e) { /* ログ失敗は無視 */ }
}

// ---------- イベント ----------

function bindEvents() {
  // 免責同意
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

let notFoundLogged = "";
function renderModelResults() {
  const q = document.getElementById("model-search").value.trim().toLowerCase().replace(/[-\s]/g, "");
  const list = document.getElementById("model-results");
  list.innerHTML = "";
  const candidates = db
    .filter((k) => k.maker === state.maker)
    .filter((k) => !q || k.model.toLowerCase().replace(/[-\s]/g, "").includes(q))
    .slice(0, 12);
  candidates.forEach((k) => {
    const li = document.createElement("li");
    li.innerHTML = `${escapeHtml(k.model)}<small>${escapeHtml(k.series || "")}</small>`;
    li.addEventListener("click", () => selectKeyboard(k));
    list.appendChild(li);
  });
  if (candidates.length === 0 && q) {
    const li = document.createElement("li");
    li.textContent = "見つかりません。機種名の表記をご確認いただくか、トークで直接ご相談ください。";
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

  // 有線USB
  const plans = kb.usb_to_host && kb.usb_port_type && CABLE_PLANS[dev.port] ? CABLE_PLANS[dev.port][kb.usb_port_type] : null;
  if (plans) {
    const planHtml = plans.map((p, i) => `
      <div class="plan ${i === 0 ? "rec" : ""}">
        <div class="plan-head">${planLabel(i)}${i === 0 ? '<span class="rec-badge">おすすめ</span>' : ""}</div>
        <ul class="buy-list">${p.items.map((it) => `<li>🛒 ${escapeHtml(it)}</li>`).join("")}</ul>
        ${p.note ? `<p class="plan-note">${escapeHtml(p.note)}</p>` : ""}
      </div>`).join("");
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 USBケーブルで接続<span class="method-tag">いちばん確実</span></h3>
        <p class="port-line">鍵盤側の端子：<b>${PORT_LABEL[kb.usb_port_type] || escapeHtml(kb.usb_port_type)}</b></p>
        ${planHtml}
        <p class="to-host-note">⚠️ 鍵盤にUSB端子が2つある機種は挿し間違いにご注意ください。USBメモリ用の「TO DEVICE」端子ではなく、<b>「USB TO HOST」端子</b>に接続します。</p>
        <p class="item-note">つなぐ順番：鍵盤の電源を入れる → ケーブルを接続 → アプリを起動${dev.label === "Android" ? "<br>※ Android側はOTG（USBホスト機能）対応が必要です（近年のほとんどの機種は対応）。" : ""}</p>
      </div>`);
    summaries.push(`USB接続（鍵盤側:${kb.usb_port_type}）`);
  }

  // MIDI DIN（USBがない場合のみメイン案内）
  if (kb.midi_din && !kb.usb_to_host) {
    const adapter = DIN_ADAPTER[dev.port];
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 MIDI端子（丸い5ピン）で接続<span class="method-tag">この機種の接続方法</span></h3>
        <div class="plan rec">
          <div class="plan-head">購入プランA<span class="rec-badge">おすすめ</span></div>
          <ul class="buy-list">
            <li>🛒 USB-MIDIインターフェース（例：YAMAHA UX16）</li>
            ${adapter ? `<li>🛒 ${escapeHtml(adapter)}</li>` : ""}
          </ul>
        </div>
        <p class="item-note">鍵盤のMIDI IN/OUT端子とインターフェースを接続します（INとOUTをクロスでつなぎます）。</p>
      </div>`);
    summaries.push("MIDI DIN接続（USB-MIDIインターフェース使用）");
  }

  // Bluetooth
  if (kb.bluetooth_midi) {
    parts.push(`
      <div class="method bt-method">
        <h3>📶 Bluetooth MIDI<span class="method-tag sub">ケーブル不要・遅延あり</span></h3>
        <p class="item-note">わずかな遅延が出るため、演奏の反応が気になる場合は有線がおすすめです。設定のBluetooth画面ではなく、アプリ内のMIDI設定から接続してください。</p>
      </div>`);
    summaries.push("Bluetooth MIDI対応");
  }

  // どれもない
  if (summaries.length === 0) {
    parts.push(`
      <div class="method">
        <h3>⚠️ 外部接続端子が確認できませんでした</h3>
        <p class="item-note">MIDI接続に対応していない可能性があります。下のボタンからご相談ください。</p>
      </div>`);
    summaries.push("接続端子なしの可能性");
  }

  if (kb.notes) {
    parts.push(`<details class="kb-notes"><summary>この機種の補足情報</summary><p>${escapeHtml(kb.notes)}</p></details>`);
  }

  parts.push(`<p class="soft-consult">💬 ご案内に不安がある場合は、下のボタンからお気軽にご相談ください。確認してお返事します。</p>`);

  state.methodSummary = summaries.join(" / ");
  card.innerHTML = parts.join("");
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
