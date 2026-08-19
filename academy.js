// ============================================================
// academy.js — アカデミー受講セット診断（アカデミー生向け）
//
// 既存版（app.js）との関係:
//   ・機種DB / ケーブル判定 / 端子画像などの「事実」は shared/catalog.js を共用
//   ・フロー・文言（会話）はこのファイル専用。既存版とは独立に変更してよい
// 流れ: 1ジャズステ端末 → 2ピアノ → (2.5端子) → 3講義用端末 → 4音 → 結果
// ============================================================

// アカデミー版LIFF ID。LINE Developersコンソールで登録後に設定する。
// 空の間はLIFF初期化をスキップし、素のWebページとして動く
// （配布はオプチャのノートのリンク経由なので、LIFF無しでも成立する）。
const ACADEMY_LIFF_ID = "";

// 機材相談部屋（サブトークルーム）の招待リンク。
// LINEの仕様上URLは短縮できないため、ツール側にボタンとして埋め込んで
// 「診断 → コピー → 部屋を開く → 貼る」を一本道にする（2026-08-19）
const KIZAI_ROOM_URL = "https://line.me/ti/g2/o8fIBEC9CfxOMMFGQTVUa1H0WpOtsGtG26mJmQ";

let db = [];
let state = {
  device: null,     // ジャズステに使う端末（DEVICES の値）
  maker: null,
  keyboard: null,   // 機種DBのレコード
  port: null,       // DBに端子形状が無いときにユーザーが選んだ形
  lecture: null,    // 講義用端末 { key, label, sub, art }
  sound: null,      // "ok"（音を出せる） / "ng"（出せない）
  methodSummary: "",
  copyText: "",
};
let liffReady = false;

// ---------- 初期化 ----------

document.addEventListener("DOMContentLoaded", async () => {
  initLiff();
  db = await loadKeyboardDb();
  bindGlobal();
  renderStrip();
  goStep("device");
});

// アカデミー版はオプチャのノートからリンクで開く運用のため、
// 既存版のような「LINE外を弾くゲート」は置かない。
// LIFF IDが設定されていれば初期化だけ試みる（トーク送信の可否判定用）。
async function initLiff() {
  if (!ACADEMY_LIFF_ID) { showApp(); return; }
  try {
    await liff.init({ liffId: ACADEMY_LIFF_ID });
    liffReady = true;
  } catch (e) { /* LIFF外でもそのまま使える */ }
  showApp();
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
  if (!localStorage.getItem("disclaimerAcceptedAcademy")) show("disclaimer-overlay");
}

function bindGlobal() {
  const agreeCheck = document.getElementById("agree-check");
  const agreeBtn = document.getElementById("agree-btn");
  agreeCheck.addEventListener("change", () => { agreeBtn.disabled = !agreeCheck.checked; });
  agreeBtn.addEventListener("click", () => {
    localStorage.setItem("disclaimerAcceptedAcademy", "1");
    hide("disclaimer-overlay");
    logEvent("disclaimer_accept");
  });

  // 埋まったスロットをタップすると、その質問に戻れる
  document.getElementById("slot-device").addEventListener("click", () => goStep("device"));
  document.getElementById("slot-kb").addEventListener("click", () => goStep("keyboard"));
  document.getElementById("slot-lecture").addEventListener("click", () => { if (state.keyboard) goStep("lecture"); });
  document.getElementById("slot-sound").addEventListener("click", () => { if (state.lecture) goStep("sound"); });
  const toPort = () => { if (state.device && state.keyboard) goStep(needsPortPick() ? "port" : "lecture"); };
  document.getElementById("plug-l").addEventListener("click", toPort);
  document.getElementById("plug-r").addEventListener("click", toPort);

  window.addEventListener("resize", positionTail);
}

// ---------- 完成図（サマリー帯） ----------

function kbPort() {
  if (!state.keyboard) return null;
  return state.keyboard.usb_port_type || state.port;
}

function needsPortPick() {
  const kb = state.keyboard;
  return !!(kb && kb.usb_to_host && !kb.usb_port_type && !state.port);
}

function renderStrip() {
  const dev = state.device;
  const kb = state.keyboard;

  const dSlot = document.getElementById("slot-device");
  dSlot.classList.toggle("filled", !!dev);
  dSlot.querySelector(".slot-badge").textContent = dev ? "✓" : "1";
  dSlot.querySelector(".slot-art").innerHTML = dev ? ART[dev.art] : ART.q;
  dSlot.querySelector(".slot-label").textContent = dev ? dev.label : "未選択";

  const kSlot = document.getElementById("slot-kb");
  kSlot.classList.toggle("filled", !!kb);
  kSlot.querySelector(".slot-badge").textContent = kb ? "✓" : "2";
  kSlot.querySelector(".slot-art").innerHTML = kb ? ART.piano : ART.q;
  kSlot.querySelector(".slot-label").textContent = kb ? kb.model : "未選択";

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

  // 2段目
  const lSlot = document.getElementById("slot-lecture");
  const lec = state.lecture;
  lSlot.classList.toggle("filled", !!lec);
  lSlot.querySelector(".slot-badge").textContent = lec ? "✓" : "3";
  lSlot.querySelector(".slot-art").innerHTML = lec ? ART[lec.art] : ART.q;
  lSlot.querySelector(".slot-label").textContent = lec ? lec.stripLabel : "未選択";

  const sSlot = document.getElementById("slot-sound");
  sSlot.classList.toggle("filled", !!state.sound);
  sSlot.querySelector(".slot-badge").textContent = state.sound ? "✓" : "4";
  sSlot.querySelector(".slot-art").innerHTML = state.sound ? ART.ear : ART.q;
  sSlot.querySelector(".slot-label").textContent =
    state.sound === "ng" ? "イヤホン" : state.sound === "ok" ? "スピーカー" : "未選択";
}

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
  else if (step === "lecture") { aimAt("slot-lecture"); body.innerHTML = lecturePanel(); bindLecturePanel(); }
  else if (step === "sound") { aimAt("slot-sound"); body.innerHTML = soundPanel(); bindSoundPanel(); }
  else if (step === "result") { aimAt("slot-sound"); panel.classList.add("wide"); body.innerHTML = resultPanel(); bindResultPanel(); }
  positionTail();
  setTimeout(positionTail, 320);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 全部答え終わっているか（スロットタップで戻ったあとの行き先判定）
function nextUnanswered() {
  if (!state.device) return "device";
  if (!state.keyboard) return "keyboard";
  if (needsPortPick()) return "port";
  if (!state.lecture) return "lecture";
  if (!state.sound) return "sound";
  return "result";
}

// --- 1. ジャズステに使う端末 ---

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
    <h2 class="txt-head">Jazz-Stepsアプリに使う端末は？</h2>
    <p class="hint">レッスン中、<strong>ピアノとつないで課題に取り組む端末</strong>です。講義を見る端末はあとで別に選びます。</p>
    <div class="choices">${items}</div>
    <p class="hint">💡 iPhone/iPadは充電口の形で見分けられます。金属の板がむき出しなのがLightning、楕円の筒型なのがUSB-Cです。右のアイコンは充電ケーブルの先端の形です。</p>`;
}

function deviceLogLabel() {
  const d = state.device;
  return d ? d.label + "（" + d.sub + "）" : "";
}

function bindDevicePanel() {
  document.querySelectorAll("#panel-body .choice[data-device]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.device = DEVICES[btn.dataset.device];
      // 端末が変わると「同じ端末で受講」の意味も変わるので講義用の選択はリセット
      state.lecture = null;
      renderStrip();
      logEvent("device_select", { device: deviceLogLabel() });
      goStep(nextUnanswered());
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
    </div>`).join("");
  return `
    <h2 class="txt-head">お使いのキーボード・電子ピアノは？</h2>
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
    .filter((k) => !q || keyboardMatches(k, raw))
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
    li.innerHTML = '<span>見つかりません。機種名の表記をご確認いただくか、オープンチャットの「機材相談部屋」でご相談ください。</span>';
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
  logEvent("keyboard_select", { maker: kb.maker, model: kb.model, device: deviceLogLabel() });
  goStep(nextUnanswered());
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
      logEvent("port_pick", { maker: state.keyboard.maker, model: state.keyboard.model, device: deviceLogLabel(), note: state.port });
      goStep(nextUnanswered());
    });
  });
}

// --- 3. 講義を見る端末 ---

// stripLabel: 完成図に出す短い名前
function lectureOptions() {
  const jazzIsPc = state.device && state.device.platform === "web";
  if (jazzIsPc) {
    return [
      { key: "same-pc", label: "このパソコン1台で受講", sub: "画面を左右に並べて講義とアプリを同時に表示", art: "laptop", stripLabel: "同じPC", badge: "おすすめ" },
      { key: "tablet",  label: "タブレット", sub: "講義を見る用にもう1台", art: "tablet", stripLabel: "タブレット" },
      { key: "phone",   label: "スマホ", sub: "講義を見る用にもう1台", art: "phone", stripLabel: "スマホ" },
      { key: "pc2",     label: "別のパソコン", sub: "講義を見る用にもう1台", art: "laptop", stripLabel: "別のPC" },
    ];
  }
  return [
    { key: "pc",     label: "パソコン", sub: "画面が大きく、いちばん見やすい", art: "laptop", stripLabel: "パソコン", badge: "おすすめ" },
    { key: "tablet", label: "タブレット", sub: "", art: "tablet", stripLabel: "タブレット" },
    { key: "phone",  label: "スマホ", sub: "画面は小さめ。持ち方の工夫が必要", art: "phone", stripLabel: "スマホ" },
    { key: "same",   label: "2台目はない", sub: `${state.device ? state.device.label : "ジャズステ用の端末"}1台で切り替えながら受講`, art: state.device ? state.device.art : "phone", stripLabel: "同じ端末" },
  ];
}

function lecturePanel() {
  const items = lectureOptions().map((o) => {
    const sel = state.lecture && state.lecture.key === o.key ? " selected" : "";
    return `<button class="choice${sel}" data-lecture="${o.key}">
        <span class="choice-art">${ART[o.art]}</span>
        <span class="txt">${escapeHtml(o.label)}${o.badge ? `<span class="opt-badge">${o.badge}</span>` : ""}<small>${escapeHtml(o.sub)}</small></span>
      </button>`;
  }).join("");
  return `
    <h2 class="txt-head">講義（講師の画面）は何で見ますか？</h2>
    <p class="hint">レッスン当日は <b>Google Meet</b> で講義を見ながら、${escapeHtml(state.device.label)}のジャズステで課題に取り組みます。カメラ・マイクはオフのままでOK、顔は映りません。</p>
    <div class="choices">${items}</div>`;
}

function bindLecturePanel() {
  const opts = lectureOptions();
  document.querySelectorAll("#panel-body .choice[data-lecture]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lecture = opts.find((o) => o.key === btn.dataset.lecture);
      renderStrip();
      logEvent("lecture_select", { note: state.lecture.label, device: deviceLogLabel() });
      goStep(nextUnanswered());
    });
  });
}

// --- 4. 音 ---

function soundPanel() {
  const sel = (v) => (state.sound === v ? " selected" : "");
  return `
    <h2 class="txt-head">レッスン中、部屋に音を出せますか？</h2>
    <p class="hint">夜のレッスンで家族が寝ている、集合住宅で音が気になる…という方は「出せない」を選んでください。あなたに合ったイヤホンの使い方をご案内します。</p>
    <div class="choices">
      <button class="choice${sel("ok")}" data-sound="ok">
        <span class="choice-art">🔊</span>
        <span class="txt">音を出せる<small>スピーカーから音を出して受講できる</small></span>
      </button>
      <button class="choice${sel("ng")}" data-sound="ng">
        <span class="choice-art">🎧</span>
        <span class="txt">出せない・イヤホンで受けたい<small>まわりに音を聞かせられない</small></span>
      </button>
    </div>`;
}

function bindSoundPanel() {
  document.querySelectorAll("#panel-body .choice[data-sound]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sound = btn.dataset.sound;
      renderStrip();
      logEvent("sound_select", { note: state.sound, device: deviceLogLabel() });
      goStep(nextUnanswered());
    });
  });
}

// ---------- 受講パターンの導出 ----------

// "pc1"（PC1台・画面分割） / "mobile1"（スマホorタブ1台・切替） / "two"（2台）
function derivePattern() {
  const l = state.lecture;
  if (!l) return null;
  const one = l.key === "same" || l.key === "same-pc";
  if (one && state.device.platform === "web") return "pc1";
  if (one) return "mobile1";
  return "two";
}

// 接続方法の判定（既存版と同じロジック）
function deriveConnection() {
  const kb = state.keyboard;
  const dev = state.device;
  const port = kbPort();
  const hasUsb = !!(kb.usb_to_host && port && CABLE_PLANS[dev.port] && CABLE_PLANS[dev.port][port]);
  const hasDin = !!kb.midi_din;
  const btUsable = !!(kb.bluetooth_midi && dev.platform === "ios");
  return { port, hasUsb, hasDin, btUsable };
}

// アプリの音がどこから出るか。
// USBオーディオ対応機種は、接続するとアプリの音の出口がピアノ側に切り替わる
function appSoundOut(conn) {
  return conn.hasUsb && state.keyboard.usb_audio ? "piano" : "device";
}

// ---------- 結果 ----------

// アカデミー版は楽天リンクを出さない（2026-08-19 運営方針）。
// 検証済みのAmazon直接リンク（catalog.js の az フィールド）がある品だけリンクを付ける
function buyItem(it) {
  const link = it.az
    ? `<a class="buy-link" href="${it.az}" target="_blank" rel="noopener">Amazonで見る ▸</a>`
    : "";
  const note = it.azNote ? `<small class="az-note">※${escapeHtml(it.azNote)}</small>` : "";
  return `<li><span class="buy-name">🛒 ${escapeHtml(it.t)}${note}</span>${link}</li>`;
}

// プランA＝「推奨ケーブル」として単独表示し、B以降はアコーディオンに畳む
function planBlockMain(plan) {
  return `
    <div class="plan rec">
      <div class="plan-head">推奨ケーブル</div>
      <ul class="buy-list">${plan.items.map((it) => buyItem(it)).join("")}</ul>
      ${plan.note ? `<p class="plan-note">${escapeHtml(plan.note)}</p>` : ""}
    </div>`;
}

function planBlockAlts(plans) {
  if (!plans.length) return "";
  const inner = plans.map((p) => `
    <div class="plan">
      <div class="plan-head">代替案</div>
      <ul class="buy-list">${p.items.map((it) => buyItem(it)).join("")}</ul>
      ${p.note ? `<p class="plan-note">${escapeHtml(p.note)}</p>` : ""}
    </div>`).join("");
  return `<details class="alt-plans"><summary>他の接続方法を見る</summary>${inner}</details>`;
}

function planBlock(plans) {
  return planBlockMain(plans[0]) + planBlockAlts(plans.slice(1));
}

// 音の流れの説明（凡例2行と、コピー用の1行テキスト）
function soundRouting(pattern, conn) {
  const appOut = appSoundOut(conn);
  const kbName = state.keyboard.model;
  const jazzName = state.device.label;
  const lecName = state.lecture.stripLabel;
  const r = { lines: [], copy: "", earphones: 0, notes: [] };

  if (state.sound === "ok") {
    // スピーカー派に音の経路の説明は不要（自明なため表示しない。2026-08-19 運営方針）
    r.copy = "スピーカーで受講";
    return r;
  }

  // 音を出せない場合
  //
  // USBオーディオ対応機種（appOut === "piano"）は、接続中その端末の音が
  // 「アプリの音もMeetの音も含めて全部」ピアノ側から出る（端末のシステム音声の
  // 出力先がピアノに切り替わるため）。したがって同じ端末で完結する構成
  // （pc1 / mobile1）では、ピアノのヘッドホン端子にイヤホン1本で足りる。
  // 片耳ずつが必要なのは、音の出どころが2台に分かれる「two」だけ。
  if (pattern === "pc1") {
    if (appOut === "piano") {
      r.lines.push(["app", "アプリの音", "ピアノのヘッドホン端子に挿したイヤホンから"]);
      r.lines.push(["meet", "講師の声", "同じイヤホンから（この機種は接続中、パソコンの音がすべてピアノ側から出るため1本でOK）"]);
      r.copy = "音出せない → ピアノのヘッドホン端子にイヤホン1本";
      r.earphones = 1;
      r.notes.push(`もし講師の声がパソコン側から出てしまう場合は、パソコンの音の出力先を「${kbName}」に切り替えてください。`);
    } else {
      r.lines.push(["app", "アプリの音", "パソコンに挿したイヤホンから"]);
      r.lines.push(["meet", "講師の声", "同じイヤホンから（どちらもPCの音なので1本でOK）"]);
      r.copy = "音出せない → PCにイヤホン1本（アプリも講師の声も両方聞こえる）";
      r.earphones = 1;
    }
  } else if (pattern === "mobile1") {
    if (appOut === "piano") {
      r.lines.push(["app", "アプリの音", "ピアノのヘッドホン端子に挿したイヤホンから"]);
      r.lines.push(["meet", "講師の声", `同じイヤホンから（この機種は接続中、${jazzName}の音がすべてピアノ側から出るため1本でOK）`]);
      r.copy = "音出せない → ピアノのヘッドホン端子にイヤホン1本";
      r.earphones = 1;
    } else {
      r.lines.push(["app", "アプリの音", `${jazzName}に挿したイヤホンから`]);
      r.lines.push(["meet", "講師の声", "同じイヤホンから（同じ端末なので1本でOK）"]);
      r.copy = `音出せない → ${jazzName}にイヤホン1本`;
      r.earphones = 1;
    }
  } else {
    // 2台構成: 片耳ずつが基本
    const appEar = appOut === "piano" ? "ピアノのヘッドホン端子に挿したイヤホン" : `${jazzName}に挿したイヤホン`;
    r.lines.push(["app", "アプリの音", `${appEar}を片耳に`]);
    r.lines.push(["meet", "講師の声", `講義用（${lecName}）に挿したイヤホンをもう片耳に`]);
    r.copy = `音出せない → イヤホン片耳ずつ（アプリ=${appOut === "piano" ? "ピアノ" : jazzName}／講師=講義用）`;
    r.earphones = 2;

    // iPhone/iPad はMIDIケーブルで唯一の端子がふさがる
    if (appOut !== "piano" && state.device.platform === "ios") {
      r.notes.push(`<b>${jazzName}は、ピアノとつなぐと充電口がふさがるため有線イヤホンを挿せません。</b>解決策は3つ：
        ①電源・ピアノ・イヤホンを同時につなげる<b>USBハブ</b>を使う（いちばん確実）
        ②<b>Bluetoothイヤホン</b>を使う（わずかな音の遅れが出ることがあります。気になったら③へ）
        ③アプリの音はあきらめて、<b>ピアノ本体にヘッドホンを挿して自分の演奏音だけ聴く</b>（お手本の音やカウントが聞こえなくなるため次善の策です）`);
    }
    if (state.device.platform === "android") {
      r.notes.push("Androidでイヤホンジャックの無い機種も同様に、USBハブかBluetoothイヤホンをご検討ください。");
    }
  }
  return r;
}

// 当日の手順
function daySteps(pattern, conn) {
  const steps = [];
  const jazz = state.device.label;
  const cableStep = conn.hasUsb || conn.hasDin
    ? `ピアノの電源を入れて、ケーブルで${jazz}とつなぐ`
    : `ピアノと${jazz}を接続する（Bluetooth設定）`;

  if (pattern === "pc1") {
    steps.push(cableStep + "（パソコンはつないだあとに画面を再読み込み）");
    steps.push("Chromeでジャズステのサイトを開き、別ウィンドウでGoogle Meetを開いて<b>左右に並べる</b>（幅が足りないときはブラウザの拡大率を90%程度に下げると並べられます）");
    steps.push(state.sound === "ng" ? "イヤホンをパソコンに挿し、ピアノ本体の音量を0にする" : "ピアノ本体の音量は0にして、アプリの音で弾く（音が二重になるのを防ぐため）");
    steps.push("Meetはカメラ・マイクともオフでOK。講義を見ながら、課題が出たらアプリ側で弾く");
  } else if (pattern === "mobile1") {
    steps.push(cableStep);
    steps.push(`${jazz}でGoogle Meetとジャズステアプリを<b>切り替えながら</b>受講する（講義を聞くときはMeet、弾くときはアプリ）`);
    if (state.sound === "ng") steps.push("イヤホンを挿して、ピアノ本体の音量を0にする");
    steps.push("切り替えが忙しく感じたら、次回から2台目（家族のスマホでも可）の用意をおすすめします");
  } else {
    steps.push(cableStep);
    steps.push(`講義用（${state.lecture.stripLabel}）でGoogle Meetを開く（カメラ・マイクはオフでOK）`);
    if (state.sound === "ng") steps.push("イヤホンを2本用意して、片耳ずつ装着する（下の「音の流れ」参照）");
    steps.push(`講義を見ながら、課題が出たら${jazz}で弾く。質問はMeetのチャットからどうぞ`);
  }
  return steps;
}

function resultPanel() {
  const kb = state.keyboard;
  const dev = state.device;
  const conn = deriveConnection();
  const pattern = derivePattern();
  const routing = soundRouting(pattern, conn);
  const parts = [];
  const summaries = [];

  parts.push('<h2 class="txt-head">🎉 あなたの受講セットができました</h2>');

  // 61鍵未満はレッスンが成立しない
  if (kb.keys && kb.keys < 61) {
    parts.push(`
      <div class="method alert-method">
        <h3>⚠️ この機種はレッスンに使えません</h3>
        <p class="item-note">アカデミーのレッスンは<b>61鍵以上</b>を前提に作られています。この機種は${kb.keys}鍵のため、演奏範囲が足りず一部レッスンが成立しません。ピアノ選択画面の「鍵盤をこれから買う方はこちら」をご覧ください。</p>
      </div>`);
  }

  // --- サマリーカード ---
  const patternName = { pc1: "パソコン1台・画面分割", mobile1: "1台で切り替え受講", two: "2台体制" }[pattern];
  parts.push(`
    <div class="setup-card">
      <h3>📋 受講セットまとめ<span class="method-tag">${patternName}</span></h3>
      <ul class="setup-list">
        <li><span class="k">ピアノ</span><span>${escapeHtml(kb.maker)} ${escapeHtml(kb.model)}${conn.port ? "（端子: " + escapeHtml(PORT_SHORT[conn.port] || conn.port) + "）" : ""}</span></li>
        <li><span class="k">ジャズステ用</span><span>${escapeHtml(dev.label)}（${escapeHtml(dev.sub)}）</span></li>
        <li><span class="k">講義用</span><span>${escapeHtml(state.lecture.label)}</span></li>
        <li><span class="k">音</span><span>${escapeHtml(routing.copy)}</span></li>
      </ul>
    </div>`);

  // --- 音の流れ（イヤホン運用のときだけ。スピーカー派には自明なので出さない） ---
  if (routing.lines.length || routing.notes.length) {
    parts.push(`
      <details class="acc-block">
        <summary>🎧 音の流れ</summary>
        <div class="sound-map">
          ${routing.lines.map(([cls, k, v]) => `
            <div class="sound-line"><span class="sound-dot ${cls}"></span><span class="k">${k}</span><span>${v}</span></div>`).join("")}
          ${routing.notes.map((n) => `<p class="item-note">${n}</p>`).join("")}
        </div>
      </details>`);
  }

  // --- 当日の手順 ---
  parts.push(`
    <details class="acc-block">
      <summary>📅 当日の流れ</summary>
      <ol class="day-steps">${daySteps(pattern, conn).map((s) => `<li>${s}</li>`).join("")}</ol>
    </details>`);

  // --- 買うもの（ケーブル） ---
  if (conn.hasUsb) {
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 用意するケーブル<span class="method-tag">いちばん確実</span></h3>
        <p class="port-line">鍵盤側の端子：<b>${PORT_LABEL[conn.port] || escapeHtml(conn.port)}</b>${state.port ? "（お選びいただいた形）" : ""}</p>
        ${planBlock(CABLE_PLANS[dev.port][conn.port])}
        <p class="to-host-note">⚠️ 鍵盤にUSB端子が2つある機種は挿し間違いにご注意ください。USBメモリ用の「TO DEVICE」端子ではなく、<b>「USB TO HOST」端子</b>に接続します。</p>
      </div>`);
    summaries.push(`USB接続（鍵盤側:${conn.port}）`);
  }
  if (conn.hasDin && !conn.hasUsb) {
    parts.push(`
      <div class="method rec-method">
        <h3>🔌 丸型MIDI端子（5ピン）でつなげます<span class="method-tag">この機種の接続方法</span></h3>
        ${planBlock(DIN_PLANS[dev.port])}
        <p class="to-host-note">⚠️ <b>挿す向きに注意</b>。ピアノ側の「MIDI OUT」に、ケーブル側の「MIDI IN」を挿します。逆向きだと信号が流れません。</p>
      </div>`);
    summaries.push("丸型MIDI接続");
  }
  if (routing.earphones > 0) {
    parts.push(`<div class="no-buy">🎧 イヤホン／ヘッドホン <b>${routing.earphones}本</b> を使います（お手持ちのものでOK。アプリの音を聴く側は音の遅れが出にくい<b>有線</b>がおすすめです）</div>`);
  }

  // USBオーディオ機能付き機種の特記
  if (conn.hasUsb && kb.usb_audio) {
    parts.push(`
      <div class="method info-method">
        <h3>ℹ️ つなぐと端末から音が出なくなります（正常です）</h3>
        <p class="item-note">この機種はUSBケーブル1本で音の信号もやり取りするため、接続すると<b>音の出口がピアノ本体側に切り替わります</b>。故障ではありません。アプリの音は<b>ピアノ本体のスピーカー（またはピアノのヘッドホン端子）</b>から聴いてください。採点・判定は正常に動きます。</p>
      </div>`);
  }

  // Bluetooth
  if (kb.bluetooth_midi && conn.btUsable) {
    parts.push(`
      <div class="method bt-method">
        <h3>📶 Bluetooth MIDIも使えます<span class="method-tag sub">iPhone・iPadのみ</span></h3>
        <p class="item-note">ケーブル不要ですが、わずかな遅延が出るため、演奏の反応が気になる場合は有線をおすすめします。<br><b>有線とBluetoothの同時接続はしないでください</b>（入力が二重になり、押していない音が判定されることがあります）。</p>
      </div>`);
    summaries.push("Bluetooth MIDI対応（iOS）");
  }

  // 接続手段なし
  if (summaries.length === 0 && !conn.btUsable) {
    parts.push(`
      <div class="method alert-method">
        <h3>⚠️ この機種はJazz-Stepsに接続できない可能性があります</h3>
        <p class="item-note">USB端子・MIDI端子が確認できませんでした。トレーニングには<b>MIDI接続（USB Type-BまたはMIDI端子）</b>が必要です。下の「結果をコピー」して「機材相談部屋」でご相談いただくか、ピアノ選択画面の「鍵盤をこれから買う方はこちら」もご覧ください。</p>
      </div>`);
    summaries.push("接続手段が確認できず");
  }

  // トラブルシュート（既存版と同内容）
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
      <p class="item-note"><b>弾いた音と違う音が判定される・音域がずれる場合</b>は、まずピアノ本体の<b>オクターブ調整・トランスポーズ（移調）が0になっているか</b>を確認してください。</p>
    </details>`);

  if (kb.notes) {
    parts.push(`<details class="kb-notes"><summary>この機種の補足情報</summary><p>${escapeHtml(kb.notes)}</p></details>`);
  }

  // --- コピー＆相談 ---
  state.methodSummary = summaries.join(" / ");
  state.copyText = buildCopyText(conn, pattern, routing);
  // Jazz-Steps公式としての案内のため、個人の写真・名前は出さない（2026-08-19）
  parts.push(`
    <div class="consult-area">
      <p class="consult-lead">この結果をコピーしてオープンチャットの「機材相談部屋」に貼れば、そのまま運営に相談できます。うまくいかないとき・不安なときは気軽にどうぞ！</p>
      <textarea id="consult-note" placeholder="運営や部屋のメンバーに相談したいことを自由に書いてください（任意）"></textarea>
      <button id="copy-btn" class="copy-btn">📋 結果をコピーする</button>
      <p class="copy-note">コピーしたら「機材相談部屋」に貼ってください</p>
      <a id="room-btn" class="room-btn" href="${KIZAI_ROOM_URL}">💬 機材相談部屋を開く</a>
    </div>
    <button class="link-btn" id="restart-btn">最初からやり直す</button>`);

  logEvent("result_show", { maker: kb.maker, model: kb.model, device: deviceLogLabel(), summary: state.methodSummary, note: pattern + "/" + state.sound });
  return parts.join("");
}

// オプチャに貼る用の構造化テキスト
function buildCopyText(conn, pattern, routing) {
  const kb = state.keyboard;
  const patternName = { pc1: "パソコン1台・画面分割", mobile1: "1台で切り替え受講", two: "2台体制" }[pattern];
  const cable = conn.hasUsb
    ? CABLE_PLANS[state.device.port][conn.port][0].items.map((i) => i.t).join(" ＋ ")
    : conn.hasDin ? DIN_PLANS[state.device.port][0].items.map((i) => i.t).join(" ＋ ") : "（接続手段が確認できず・要相談）";
  const lines = [
    "🎹 受講セット診断の結果",
    `・ピアノ: ${kb.maker} ${kb.model}${conn.port ? "（端子: " + (PORT_SHORT[conn.port] || conn.port) + "）" : ""}`,
    `・ジャズステ用: ${state.device.label}（${state.device.sub}）`,
    `・ケーブル: ${cable}`,
    `・講義用: ${state.lecture.label}（${patternName}）`,
    `・音: ${routing.copy}`,
  ];
  return lines.join("\n");
}

function bindResultPanel() {
  document.getElementById("copy-btn").addEventListener("click", copySetup);
  document.getElementById("room-btn").addEventListener("click", () => logEvent("room_open"));
  document.getElementById("restart-btn").addEventListener("click", () => location.reload());
}

async function copySetup() {
  const btn = document.getElementById("copy-btn");
  const note = (document.getElementById("consult-note")?.value || "").trim();
  const text = state.copyText + "\n\n❓相談したいこと: " + (note || "");
  logEvent("setup_copy", { maker: state.keyboard.maker, model: state.keyboard.model, device: deviceLogLabel(), summary: state.methodSummary, note });
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "✅ コピーしました！「機材相談部屋」に貼ってください";
    btn.classList.add("copied");
  } catch (e) {
    // クリップボードAPIが使えない環境（LINE内ブラウザの一部など）へのフォールバック
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      btn.textContent = "✅ コピーしました！「機材相談部屋」に貼ってください";
      btn.classList.add("copied");
    } catch (e2) {
      alert("コピーできませんでした。お手数ですが、この内容を手で選択してコピーしてください：\n\n" + text);
    }
    document.body.removeChild(ta);
  }
}
