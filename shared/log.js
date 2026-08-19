// ============================================================
// shared/log.js — 利用ログ送信（GAS）
//
// 既存版・アカデミー版で同じスプレッドシートに記録する。
// アカデミー版は読み込み前に window.LOG_APP = "academy" を設定して
// レコードを区別する（既存版は未設定＝従来どおりのペイロード）。
// ============================================================

const LOG_ENDPOINT = "https://script.google.com/macros/s/AKfycbyirD-1iBPuaiR7rVhMT7NUeF6pGZbLlzJxNgSL-qjzzuRakrOEn8ygfnm9Sv4agYo7KQ/exec";

// ?preview=1 は開発者用のバイパス。検証アクセスが利用実績に混ざると
// デイリーレポートの数字が歪むため、preview時はログを送らない。
const IS_PREVIEW = new URLSearchParams(location.search).has("preview");

function logEvent(type, data = {}) {
  if (!LOG_ENDPOINT || IS_PREVIEW) return;
  try {
    const base = window.LOG_APP ? { type, app: window.LOG_APP } : { type };
    const payload = JSON.stringify(Object.assign(base, data));
    fetch(LOG_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: payload }).catch(() => {});
  } catch (e) { /* ログ失敗は無視 */ }
}
