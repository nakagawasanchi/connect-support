const LIFF_ID = "2010931633-3uzRGseS";

// 共有カタログ（機種・ケーブル・端子の事実データ）とログ送信は
// shared/catalog.js / shared/log.js に移動した（アカデミー版と共用）。
// このファイルには既存版のフロー（会話）だけを置く。

let db = [];
let state = { device: null, maker: null, keyboard: null, port: null, methodSummary: "" };
let liffReady = false;

// ---------- 初期化 ----------

document.addEventListener("DOMContentLoaded", async () => {
  initLiff();
  db = await loadKeyboardDb();
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

// ログ用の端末名。labelは画面表示用に「iPhone」まで縮めてあるので、
// そのまま記録するとLightning版とUSB-C版が区別できなくなる（案内するケーブルは
// まったく別物なので、デイリーレポートの端末別内訳が意味をなさなくなる）。
function deviceLogLabel() {
  const d = state.device;
  return d ? d.label + "（" + d.sub + "）" : "";
}

function bindDevicePanel() {
  document.querySelectorAll("#panel-body .choice[data-device]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.device = DEVICES[btn.dataset.device];
      renderStrip();
      logEvent("device_select", { device: deviceLogLabel() });
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
  logEvent("keyboard_select", { maker: kb.maker, model: kb.model, device: deviceLogLabel() });
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
      logEvent("port_pick", { maker: state.keyboard.maker, model: state.keyboard.model, device: deviceLogLabel(), note: state.port });
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
  logEvent("result_show", { maker: kb.maker, model: kb.model, device: deviceLogLabel(), summary: state.methodSummary });
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
  logEvent("consult_send", { maker: kb.maker, model: kb.model, device: deviceLogLabel(), note });
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
