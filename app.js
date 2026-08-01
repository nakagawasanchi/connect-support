const LIFF_ID = "2010931633-3uzRGseS";

const DEVICES = {
  "iphone-lightning": { label: "iPhone（Lightning端子）", port: "lightning" },
  "iphone-usbc":      { label: "iPhone（USB-C端子）",     port: "usbc" },
  "ipad-usbc":        { label: "iPad（USB-C端子）",       port: "usbc" },
  "ipad-lightning":   { label: "iPad（Lightning端子）",   port: "lightning" },
  "android":          { label: "Android",                 port: "usbc" },
};

const MAKER_ORDER = ["YAMAHA", "CASIO", "Roland", "KORG", "KAWAI"];

const PORT_LABEL = {
  "USB-B":   "USB-B端子（四角い形・プリンタと同じ）",
  "micro-B": "USB micro-B端子（小さい台形）",
  "mini-B":  "USB mini-B端子（小さい六角形）",
  "USB-C":   "USB-C端子（楕円形）",
};

// 端末側の端子 × 鍵盤側の端子 → 必要なもの
const CABLE_RECIPES = {
  lightning: {
    "USB-B":   ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A-Bケーブル（プリンタ用と同じ）"],
    "micro-B": ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A - micro Bケーブル（データ通信対応のもの）"],
    "mini-B":  ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A - mini Bケーブル"],
    "USB-C":   ["Apple Lightning - USB 3カメラアダプタ（純正推奨）", "USB A - Cケーブル（データ通信対応のもの）"],
  },
  usbc: {
    "USB-B":   ["USB-C - USB-Bケーブル 1本（または手持ちのA-Bケーブル + USB-C変換アダプタ）"],
    "micro-B": ["USB-C - micro Bケーブル（データ通信対応のもの）"],
    "mini-B":  ["USB-C - mini Bケーブル"],
    "USB-C":   ["USB-C - USB-Cケーブル（データ通信対応のもの）"],
  },
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

async function initLiff() {
  const status = document.getElementById("liff-status");
  try {
    await liff.init({ liffId: LIFF_ID });
    liffReady = true;
    if (!liff.isInClient()) {
      status.textContent = "※ LINEアプリのトークから開くと、そのまま相談を送信できます";
    }
  } catch (e) {
    status.textContent = "";
  }
}

// ---------- STEP 1: 端末 ----------

function bindEvents() {
  document.querySelectorAll("#device-choices .choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.device = DEVICES[btn.dataset.device];
      document.querySelectorAll("#device-choices .choice").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      show("step-keyboard");
      document.getElementById("step-keyboard").scrollIntoView({ behavior: "smooth" });
    });
  });

  document.getElementById("model-search").addEventListener("input", renderModelResults);
  document.getElementById("unknown-model-btn").addEventListener("click", () => {
    hide("step-result");
    show("step-unknown");
  });
  document.getElementById("unknown-back-btn").addEventListener("click", () => hide("step-unknown"));
  document.getElementById("restart-btn").addEventListener("click", () => location.reload());
  document.getElementById("consult-btn").addEventListener("click", sendConsult);
  document.getElementById("unknown-consult-btn").addEventListener("click", sendUnknownConsult);
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
    btn.className = "choice";
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
    });
    area.appendChild(btn);
  });
}

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
    li.textContent = "見つかりません → 下の「機種がわからない・一覧にない」からご相談ください";
    list.appendChild(li);
  }
}

// ---------- STEP 3: 結果 ----------

function selectKeyboard(kb) {
  state.keyboard = kb;
  renderResult();
  show("step-result");
  hide("step-unknown");
  document.getElementById("step-result").scrollIntoView({ behavior: "smooth" });
}

function renderResult() {
  const kb = state.keyboard;
  const dev = state.device;
  const card = document.getElementById("result-card");
  const parts = [];
  const summaries = [];

  const badge = kb.verified
    ? '<span class="badge ok">仕様確認済み</span>'
    : '<span class="badge warn">参考情報（要確認）</span>';
  parts.push(`<p class="kb-name">${escapeHtml(kb.maker)} ${escapeHtml(kb.model)}${badge}</p>`);
  parts.push(`<p class="item-note">${escapeHtml(dev.label)} との接続方法です。</p>`);

  // 有線USB
  if (kb.usb_to_host && kb.usb_port_type && CABLE_RECIPES[dev.port][kb.usb_port_type]) {
    const items = CABLE_RECIPES[dev.port][kb.usb_port_type];
    parts.push(`
      <div class="method">
        <h3>✅ おすすめ：USBケーブルで接続</h3>
        <p class="item-note">鍵盤側の端子：${PORT_LABEL[kb.usb_port_type] || escapeHtml(kb.usb_port_type)}</p>
        <p>必要なもの：</p>
        <ol>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>
        <p class="item-note">つないだらアプリを起動するだけで認識されます（鍵盤の電源を入れてからアプリを開いてください）。${dev.label === "Android" ? "※ Android側はOTG（USBホスト機能）対応が必要です。近年のほとんどの機種は対応しています。" : ""}</p>
      </div>`);
    summaries.push(`USB接続（鍵盤側:${kb.usb_port_type}）`);
  }

  // MIDI DIN（USBがない場合のみメイン案内）
  if (kb.midi_din && !kb.usb_to_host) {
    parts.push(`
      <div class="method">
        <h3>✅ MIDI端子（丸い5ピン）で接続</h3>
        <p>必要なもの：</p>
        <ol>
          <li>USB-MIDIインターフェース（例：YAMAHA UX16）</li>
          ${dev.port === "lightning" ? "<li>Apple Lightning - USB 3カメラアダプタ（純正推奨）</li>" : "<li>USB-C変換アダプタ（インターフェースがUSB-Aの場合）</li>"}
        </ol>
        <p class="item-note">鍵盤のMIDI IN/OUT端子とインターフェースを接続します（INとOUTをクロスでつなぎます）。</p>
      </div>`);
    summaries.push("MIDI DIN接続（USB-MIDIインターフェース使用）");
  }

  // Bluetooth
  if (kb.bluetooth_midi) {
    parts.push(`
      <div class="method">
        <h3>📶 Bluetooth MIDIでも接続できます</h3>
        <p class="item-note">ケーブル不要ですが、わずかな遅延が出るため、演奏の反応が気になる場合は有線をおすすめします。設定内のBluetooth画面ではなく、アプリ内のMIDI設定から接続してください。</p>
      </div>`);
    summaries.push("Bluetooth MIDI対応");
  }

  // どれもない
  if (summaries.length === 0) {
    parts.push(`
      <div class="method">
        <h3>⚠️ この機種は外部接続端子が確認できませんでした</h3>
        <p class="item-note">MIDI接続に対応していない可能性があります。下のボタンからご相談ください。</p>
      </div>`);
    summaries.push("接続端子なしの可能性");
  }

  if (kb.notes) {
    parts.push(`<p class="item-note">補足：${escapeHtml(kb.notes)}</p>`);
  }

  state.methodSummary = summaries.join(" / ");
  card.innerHTML = parts.join("");
}

// ---------- 相談送信 ----------

async function sendConsult() {
  const kb = state.keyboard;
  const note = document.getElementById("consult-note").value.trim();
  const lines = [
    "【機器接続サポートからの相談】",
    `端末: ${state.device.label}`,
    `鍵盤: ${kb.maker} ${kb.model}${kb.verified ? "" : "（DB未検証）"}`,
    `案内した接続方法: ${state.methodSummary}`,
  ];
  if (note) lines.push(`相談内容: ${note}`);
  await sendToTalk(lines.join("\n"));
}

async function sendUnknownConsult() {
  const maker = document.getElementById("unknown-maker").value.trim();
  const model = document.getElementById("unknown-model").value.trim();
  const note = document.getElementById("unknown-note").value.trim();
  if (!model && !note) {
    alert("機種名または相談内容を入力してください");
    return;
  }
  const lines = [
    "【機器接続サポート・機種調査依頼】",
    `端末: ${state.device ? state.device.label : "未選択"}`,
    `メーカー: ${maker || "不明"}`,
    `機種名: ${model || "不明"}`,
  ];
  if (note) lines.push(`相談内容: ${note}`);
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
