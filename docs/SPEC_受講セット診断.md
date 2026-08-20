# 受講セット診断 仕様書（アプリ内実装向け）

- 作成: 2026-08-20 / Jazz-Steps Academy 運営
- リファレンス実装: このリポジトリの `academy.html` / `academy.js` / `shared/catalog.js`
  - 本番: https://nakagawasanchi.github.io/connect-support/academy.html
  - **仕様書とコードが食い違う場合はコード（リファレンス実装）が正**
- 楽器DB: `data/keyboards.json`（本書 §2）。**DBはこのリポジトリが原本**として今後も運営が更新する

## 0. 目的

受講生が「①何のケーブルを買えばよいか ②当日どの端末で何をするか ③音を外に出せない場合どう聴くか」を
自己解決できるようにする。結果は構造化テキストとしてコピーでき、オープンチャットに貼ると運営が一往復で回答できる。

## 1. 画面フロー

5つの質問 → 結果。上部に「完成図」（4スロット: Jazz-Steps用端末 / ピアノ / Google Meet用端末 / 音の聴き方）を常設し、
回答するたびに埋まる。埋まったスロットをタップするとその質問に戻れる（再回答時は未回答の最初の質問へ進む）。

| # | 質問 | 選択肢 | 備考 |
|---|---|---|---|
| 1 | Jazz-Stepsアプリに使う端末 | iPhone(Lightning) / iPhone(USB-C) / iPad(USB-C) / iPad(Lightning) / Android / PC(USB-A) / PC(USB-Cのみ) | §3.1 の属性を持つ |
| 2 | ピアノ | メーカー選択 → 機種名検索（§2のDB） | 「鍵盤をこれから買う方」導線あり（推奨機種の静的リスト） |
| 2.5 | 鍵盤側の端子形状 | Type-B / micro-B / mini-B / Type-C | **DBの `usb_port_type` が null かつ `usb_to_host` が true の機種のみ**表示。ユーザーが実機を見て選ぶ |
| 3 | 講義（講師の画面）を見る端末 | §3.2 参照。**質問1の回答で選択肢が変わる** | |
| 4 | 部屋に音を出せるか | 出せる(ok) / 出せない・イヤホンで受けたい(ng) | |
| — | 結果 | §5 | |

## 2. 楽器DB（data/keyboards.json）

```
{ "updated": "YYYY-MM-DD", "batch": <int>, "keyboards": [ <record>... ] }
```

### 2.1 レコードスキーマ

| フィールド | 型 | 意味 |
|---|---|---|
| maker | string | メーカー名（表示・検索・グループ化に使用） |
| model | string | 機種名（一意キーは maker+model） |
| series | string\|null | シリーズ名（表示と検索対象） |
| keys | int\|null | 鍵盤数。**61未満は警告**（§4.1） |
| release_year | int\|null | 参考情報 |
| usb_to_host | bool | USB TO HOST端子（=MIDIをUSBで出せる）の有無 |
| usb_port_type | string\|null | `"USB-B"` / `"micro-B"` / `"mini-B"` / `"USB-C"`。**null＝形状未確認**→質問2.5でユーザーに選ばせる |
| midi_din | bool | 丸型5ピンMIDI端子（IN/OUT）の有無 |
| bluetooth_midi | bool | Bluetooth MIDI対応（オーディオのみのBT対応はfalse） |
| usb_audio | bool | **重要**: USB TO HOSTがオーディオも通す機種。接続中、端末のシステム音声の出力先がピアノ側に切り替わる（§4.4の分岐に影響） |
| notes | string | 人間向け補足。結果画面に折りたたみで表示 |
| source | string | 出典URL |
| verified | bool | 公式仕様で裏取り済みか。falseは推奨リスト等からの転記 |

### 2.2 検索仕様

- 正規化: 全角英数→半角、各種ダッシュ・長音→`-`、小文字化、`-`と空白を除去
- 照合: 入力を空白で分割し、**各トークンが `normalize(maker+series+model)` に含まれれば一致**
  （「YAMAHA Piaggero NP-11」のような丸ごと入力もヒットさせるため。modelのみの照合にしないこと）
- 0件時は `model_not_found` をログし（§6）、「機材相談部屋で相談」を案内

## 3. 静的マスタ

### 3.1 端末（質問1の選択肢）

| key | 表示 | port | platform |
|---|---|---|---|
| iphone-lightning | iPhone（Lightning端子・14以前） | lightning | ios |
| iphone-usbc | iPhone（USB-C端子・15以降） | usbc | ios |
| ipad-usbc | iPad（USB-C端子） | usbc | ios |
| ipad-lightning | iPad（Lightning端子） | lightning | ios |
| android | Android | usbc | android |
| pc-usba | パソコン（USB-A端子あり） | usba | web |
| pc-usbc | パソコン（USB-C端子のみ） | usbc | web |

- platform=ios のみ Bluetooth MIDI が利用可（Androidアプリ・Web版は有線のみ）
- platform=web は「ブラウザ版（Chrome推奨）・接続後に再読み込み」の注記を出す

### 3.2 講義用端末（質問3の選択肢）

質問1が **PC（platform=web）** の場合:
`same-pc`「このパソコン1台で受講（画面を左右に分割）」【おすすめ】 / `tablet` / `phone` / `pc2`（別のPC）

それ以外の場合:
`pc`「パソコン」【おすすめ】 / `tablet` / `phone` / `same`「2台目はない（<端末名>1台で切り替えながら受講）」

**文言には質問1で選ばれた具体的な端末名（iPhone等）を埋め込む**。「ジャズステ端末」のような抽象表現は使わない。

### 3.3 ケーブル判定行列（デバイス側port × 鍵盤側端子）

先頭プラン＝「推奨ケーブル」として単独表示。2番目以降は「他の接続方法を見る」アコーディオンに畳む。
Amazonリンクは検証済みの直接リンク（楽天リンクは使わない）。

**USB接続（CABLE_PLANS）**

| 端末側 | 鍵盤側 | 推奨（プランA） | 代替（プランB） |
|---|---|---|---|
| lightning | USB-B | Type-B→Lightningケーブル1本 ★https://amzn.asia/d/04T3trQs | Lightning-USB3カメラアダプタ + USB A-Bケーブル |
| lightning | micro-B | カメラアダプタ + A-microB（データ通信対応） | — |
| lightning | mini-B | カメラアダプタ + A-miniB | — |
| lightning | USB-C | カメラアダプタ + A-C（データ通信対応） | — |
| usbc | USB-B | Type-B→Type-Cケーブル1本 ★https://amzn.asia/d/0fRMVrxY（長さが選べます） | 手持ちA-B + A→C変換アダプタ(OTG対応) |
| usbc | micro-B | C→microB（データ通信対応）1本 | 手持ちA-microB + A→C変換(OTG) |
| usbc | mini-B | C→miniB 1本 | 手持ちA-miniB + A→C変換(OTG) |
| usbc | USB-C | C→C（データ通信対応・OTG）1本 ※充電専用ケーブル不可の注記 | — |
| usba | USB-B | A-Bケーブル（プリンタ用と同じ）1本 | — |
| usba | micro-B | A-microB（データ通信対応）1本 | — |
| usba | mini-B | A-miniB 1本 | — |
| usba | USB-C | A-C（データ通信対応）1本 | — |

**丸型MIDI（DIN_PLANS）** — `usb_to_host=false && midi_din=true` の機種で使用

| 端末側 | 構成 |
|---|---|
| lightning | MIDI→USB-A変換ケーブル ★https://amzn.asia/d/03jpBaV9 + Lightning変換アダプタ（2点） |
| usbc | MIDI→Type-Cケーブル1本 ★https://amzn.asia/d/03TZunzn |
| usba | MIDI→USB-A変換ケーブル1本 ★https://amzn.asia/d/03jpBaV9 |

## 4. 判定ロジック

### 4.1 接続判定

```
port    = kb.usb_port_type ?? ユーザー選択(質問2.5)
hasUsb  = kb.usb_to_host && port が行列に存在
hasDin  = kb.midi_din
btUsable= kb.bluetooth_midi && device.platform == "ios"
```

- `kb.keys < 61` → 警告「この機種はレッスンに使えません」（61鍵以上が前提）。診断自体は続行
- hasUsb → USB行列の推奨ケーブルを提示。hasDinもあれば「USBが使えないとき」として折りたたみで併記
- !hasUsb && hasDin → DIN行列を提示
- btUsable → 「Bluetooth MIDIも使えます（遅延あり・有線推奨・**有線と同時接続禁止**）」を併記
- どれも無し → 「接続できない可能性」警告 + 相談導線
- hasUsb && kb.usb_audio → 「つなぐと端末から音が出なくなります（正常です）」情報ブロック

### 4.2 受講パターン導出

```
one = (講義用選択が same または same-pc)
pattern = one && platform==web → "pc1"   （PC1台・画面分割）
          one && それ以外       → "mobile1"（1台切り替え受講）
          それ以外              → "two"    （2台体制）
```

### 4.3 アプリ音の出口

```
appOut = (hasUsb && kb.usb_audio) ? "piano" : "device"
```
USBオーディオ機種は接続中、**端末のシステム音声（アプリの音もMeetの音も）が丸ごとピアノ側から出る**。

### 4.4 音ルーティング（質問4 × パターン × appOut の真理値表）

sound=ok（音を出せる）: **音の説明は一切表示しない**（自明なため）。コピー文言は「スピーカーで受講」のみ。

sound=ng（出せない）:

| pattern | appOut | 案内 | イヤホン |
|---|---|---|---|
| pc1 | device | PCにイヤホン1本（アプリも講師の声も両方PCから） | 1本 |
| pc1 | piano | ピアノのヘッドホン端子に1本（PCの音が全部ピアノ側から出る）。講師の声がPCから出てしまう場合はPCの音声出力先をピアノに切り替える注記 | 1本 |
| mobile1 | device | その端末に1本（同じ端末なので両方聞こえる） | 1本 |
| mobile1 | piano | ピアノのヘッドホン端子に1本（端末の音が全部ピアノ側から出る） | 1本 |
| two | device | **片耳ずつ**: アプリ=Jazz-Steps側端末のイヤホン / 講師=講義用端末のイヤホン | 2本 |
| two | piano | **片耳ずつ**: アプリ=ピアノのヘッドホン端子 / 講師=講義用端末 | 2本 |

追加注記の発動条件:
- `two && appOut==device && platform==ios` → **端子ふさがり問題**（ケーブルで充電口が埋まり有線イヤホン不可）。
  解決3択: ①USBハブ（電源+ピアノ+イヤホン同時・最推奨） ②Bluetoothイヤホン（遅延注意） ③ピアノ本体にヘッドホン（お手本・カウントは聞こえない・次善）
- `two && platform==android` → イヤホンジャック無し機種は同様にハブかBTを検討、の注記
- イヤホン使用時共通: 「アプリの音を聴く側は遅延の出にくい**有線**推奨」

### 4.5 当日の手順（結果画面・パターン別）

- **pc1**: ①ピアノの電源→ケーブルで<端末名>とつなぐ（接続後に再読み込み） ②ChromeでJazz-Steps、別ウィンドウでMeetを開き左右に並べる（幅不足はブラウザ拡大率を90%程度に） ③ng: イヤホンをPCに+ピアノ音量0 / ok: ピアノ音量0にしてアプリの音で弾く（二重防止） ④Meetはカメラ・マイクオフ
- **mobile1**: ①接続 ②<端末名>でMeetとアプリを切り替えながら受講 ③ng: イヤホン+ピアノ音量0 ④切替が忙しければ2台目を検討
- **two**: ①接続 ②講義用端末でMeetを開く（カメラ・マイクオフ） ③ng: イヤホン2本を片耳ずつ ④課題が出たら<端末名>で弾く。質問はMeetのチャット

## 5. 結果画面の構成

1. サマリーカード（ピアノ/Jazz-Steps用/講義用/音 + パターン名バッジ）
2. 「音の流れ」**アコーディオン**（sound=ngのときのみ。🟠アプリの音 / 🔵講師の声 の色分け）
3. 「当日の流れ」**アコーディオン**
4. 推奨ケーブル（+「他の接続方法を見る」アコーディオン + TO HOST挿し間違い注意）
5. イヤホン本数の案内 / usb_audio・Bluetooth・警告ブロック（該当時）
6. トラブルシュート折りたたみ（認識されないとき6手順 + オクターブ/トランスポーズずれ）
7. 相談導線: 自由記述欄（placeholder「運営や部屋のメンバーに相談したいことを自由に書いてください（任意）」）
   → **結果をコピー** → 「機材相談部屋」を開くボタン（オプチャのサブトークルームへのリンク）

### コピーされるテキスト（形式固定・運営がパースしやすいように）

```
🎹 受講セット診断の結果
・ピアノ: {maker} {model}（端子: {port略称}）
・ジャズステ用: {端末label}（{端末sub}）
・ケーブル: {推奨プランの品名を「＋」区切り}
・講義用: {講義選択label}（{パターン名}）
・音: {音ルーティングの短文}

❓相談したいこと: {自由記述（空でも行は残す）}
```

## 6. 利用ログ（現行GAS。アプリ内実装時は同等イベントを推奨）

`disclaimer_accept` / `device_select` / `maker_select` / `model_not_found`(maker, query) /
`keyboard_select` / `port_pick` / `lecture_select` / `sound_select` /
`result_show`(summary, pattern/sound) / `setup_copy`(note含む) / `room_open`

**model_not_found が未登録機種の検知源**。運営がこれを見てDBに追加する運用のため、アプリ内実装でも必ず記録すること。

## 7. 文言・トーン規約

- 呼称は「**講師**」（「先生」は使わない）/ 貼り先は「**機材相談部屋**」
- Jazz-Steps公式名義。個人名・個人の写真は出さない
- 端子は名称だけでなく形の説明を添える（例: USB Type-B（四角い形・プリンタと同じ））
- 「充電専用ケーブルはMIDI信号を通さない。データ通信対応を選ぶ」は必ず残す
- 音を出せる人に音の説明はしない（§4.4）

## 8. 実装上の注意

- DB更新はアプリリリースと独立に起きる。**DBは都度取得（キャッシュ再検証）**にする。現行はETag再検証（`cache:"no-cache"`）
- 端子不明機種（usb_port_type=null）のユーザー選択値は `port_pick` ログで収集し、運営がDBへ反映する
- 61鍵未満・接続手段なしでも診断は最後まで完了させ、相談導線に落とす（行き止まりにしない）
- 質問1をやり直したら質問3の回答はリセット（「同じ端末で受講」の意味が変わるため）
