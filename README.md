# 機器接続サポート LIFF

公式LINEの機器接続サポートをセルフサービス化するLIFFアプリ。
端末（iPhone/iPad/Android）と鍵盤の機種を選ぶと、必要なケーブル・接続手順を案内する。

- 公開URL: https://nakagawasanchi.github.io/connect-support/
- LIFF URL: https://liff.line.me/2010931633-3uzRGseS
- LINEログインチャネル: 機器接続サポート（チャネルID: 2010931633）

## 構成

- `index.html` / `style.css` / `app.js` — 静的LIFFアプリ（ビルド不要）
- `data/keyboards.json` — 鍵盤の端子仕様DB（正本は `~/50_PRIVATE/claude_code/data/keyboard_specs/keyboards.json`。更新したらこちらにコピーする）

## DBスキーマ

```json
{
  "maker": "CASIO",
  "model": "CT-S300",
  "series": "Casiotone",
  "keys": 61,
  "release_year": 2019,
  "usb_to_host": true,
  "usb_port_type": "micro-B",
  "midi_din": false,
  "bluetooth_midi": false,
  "notes": "補足",
  "source": "公式仕様ページURL",
  "verified": true
}
```

`usb_port_type`: `USB-B` / `micro-B` / `mini-B` / `USB-C` / `null`
`verified`: 公式サイト・公式PDFで裏取り済みなら true

## 未対応・今後

- FAQ（あるある質問）の組み込み
- 未知機種のAI調査バックエンド（Cloudflare Workers + Claude API・Phase 2）
