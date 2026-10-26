# wp-plugin-spec - 一時 HTTPS (CloudFlare Tunnel)

本ドキュメントは、**Local / Studio 上の HTTP サイト** を、開発者 PC から **公衆 HTTPS URL** に一時公開し、OAuth リダイレクト / 外部 Webhook / 実 SaaS API 結合などを検証するための **共通手順** を定義します。

* **段階1–3 (Local / Studio / PHPUnit)** との関係は [`SMOKE_AND_WP_ENVIRONMENTS.md`](./SMOKE_AND_WP_ENVIRONMENTS.md) §5を正とする。
* 各製品の Pass 条件は `./docs/status.md` の「100% 完了条件チェックリスト」内 **HTTPS 環境** (見出し `{#status-https}` 等) に書き、結果は `./docs/test-results.md` に日付、URL、環境付きで記録する。

## 1. 結論 (非 HTTPS の localhost から、外部連携テストは可能か)

**可能です。** 日常は `http://localhost` (Local / WordPress Studio) で WordPress や REST API を開発し、**外部サービスとの連携確認が必要な場合だけ** 一時 HTTPS を用意する構成でよい。

ポイントは **HTTPS 化の対象** です。Zoom 等のサーバーから端末に到達させるには、**`localhost` に SSL 証明書を載せるだけでは不十分** です。外部から到達できる URL と、信頼できる TLS (トンネルサービスが終端) が必要になります。

| 確認したい通信 | 典型 | 一時 HTTPS (トンネル) |
| --- | --- | --- |
| **送信** — 端末 / PHP から Zoom REST API を呼び、レスポンスを見る | Composer ライブラリの CLI、プラグインの `wp_remote_*` 試験 | **通常不要** (発信先はもともと HTTPS) |
| **受信** — Zoom から Webhook 等を WordPress REST で受ける | プラグインの `/wp-json/...` | **必要** |
| **OAuth** — ブラウザで Redirect URI を完了する | Zoom Marketplace 連携 | **必要** (HTTP / `127.0.0.1` は拒否されやすい) |

ローカルの Web サーバー (Local / Studio) を **HTTPS 専用に作り直す必要はありません**。`cloudflared` が公衆側 TLS を終端し、オリジンに **HTTP** で転送します。

**代替ツール:** [ngrok](https://ngrok.com/)、[localtunnel](https://github.com/localtunnel/localtunnel) も同型で使える。本リポジトリでは **CloudFlare Quick Tunnel** を、CloudFlare アカウント不要・追加月額なしの **デフォルト例** とする (製品 `status.md` に実際に使ったツール名を書く)。

## 2. 開発形態ごとの使い分け

送信側で見るもの: HTTP ステータス、JSON ボディ、401 / 429、タイムアウト。HTTP クライアントを注入できる設計にすると、実 API 試験とモック PHPUnit を分離できる ([S2J Webinar Service `status.md`](https://github.com/stein2nd/s2j-webinar-service/blob/main/docs/status.md) 非 HTTPS §)。

| テスト対象 | 実行環境 | 一時 HTTPS |
| --- | --- | --- |
| WordPress プラグイン REST (Webhook 受信) | Local / Studio | トンネル URL + `/wp-json/...` を Zoom 等に登録 |
| WordPress プラグイン (OAuth 画面) | ブラウザ + Local / Studio | トンネル URL を Redirect URI に登録。必要なら `home` / `siteurl` を一時変更 ([§4.2](#42-wordpress-の-url-整合)) |
| Composer ライブラリ — Zoom API **送信** | PHP CLI (`composer exec php -- ...`) | 通常 **不要** |
| Composer ライブラリ — Webhook **受信** を単体で試す | PHP 組込みサーバー等 + トンネル | 受信試験時のみトンネル (プラグイン経由が主なら WordPress 側で足りる) |

## 3. いつ使うか (環境マトリックス)

**CloudFlare Tunnel** は、下記「一時 HTTPS」の代表手段です。

| 用途 | 非 HTTPS (Local) | 一時 HTTPS (本書) | 常設ステージング |
| --- | --- | --- | --- |
| PHPUnit / PHPCS / CI | 正本 | 通常不要 | 任意 |
| 管理画面・ REST の日常確認 | 正本 | 不要 | 任意 |
| Zoom OAuth / Marketplace リダイレクト | 不可 (HTTP / `127.0.0.1` 拒否) | **可** (Quick Tunnel 等) | **可** |
| 外部からの Webhook 着信 | 不可 | **可** (トンネル URL を登録) | **可** |
| 実 SaaS API + 副作用 (起票等) | 製品により分離 ([Inquiry Destination 例](https://github.com/stein2nd/s2j-inquiry-destination)) | **可** (ステージング資格情報) | **可** |

## 4. Quick Tunnel で足りる理由 (自宅サーバー記事との違い)

[自宅 Web サーバーを Named Tunnel で公開する記事](https://qiita.com/molphosync102/items/b435de2570777c9dd23b) などは、**SSH / nginx: 80 / 取得済みドメイン / 継続公開** を前提とすることが多いです。**Local / Studio のプラグイン開発** では、次のとおり、Quick Tunnel だけでよい。

| 記事で想定しがちな前提 | Local / Studio + 本書 |
| --- | --- |
| 自宅サーバーへの SSH | **不要** (ターミナルで `cloudflared` を実行) |
| nginx が80番で `/var/www/html` | **不要** (Local / Studio の **実際の URL / ポート** を `--url` に指定) |
| 取得済み独自ドメイン | **不要** ([Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) が `*.trycloudflare.com` を発行) |
| 継続的な外部公開 | **不要** (テスト中だけ起動) |

### 4.1. 料金の目安 (2026-10時点)

公式は [Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)、[CloudFlare Tunnel 概要](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) を正とします。

Quick Tunnel は **開発・テスト向け** で SLA (サービス品質保証) はありません。URL を知る第三者がアクセスできる **公開** 構成です ([§6](#6-セキュリティ))。

| 項目 | 目安 | 備考 |
| --- | --- | --- |
| Quick Tunnel | **$0** | アカウント・独自ドメイン不要 |
| `cloudflared` クライアント | **$0** | `brew install cloudflared` |
| Named Tunnel + 自前 DNS | **$0** (トンネル自体) | ドメイン維持費は別 (既存ドメインがあれば新規購入は不要) |
| CloudFlare Access 等 | 条件による | 今回の手動 Webhook 試験では **付けない** 構成が一般的 |

## 5. 前提

* Local (または Studio) で対象プラグインが有効化済みの WordPress サイトが **HTTP** で動いている。
* トンネル先は、そのサイトの **実際の待受** (例: `http://localhost:8881`、`http://mysite.local` — 環境ごとに異なる)。
* [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) がインストール済み (macOS 例: `brew install cloudflared`)。

## 6. Quick Tunnel 手順 (開発者1人・短時間)

### 6.1. トンネル起動

1. Local または Studio でサイトを起動し、ブラウザの **オリジン URL** を控える。
2. 別ターミナルで、オリジンに合わせて起動する。

**ポート直指定 (例: Studio `localhost:8881`):**

```bash
cloudflared tunnel --url http://localhost:8881
```

**Local / Studio のカスタム・ローカルドメイン (例: `http://mysite.wp.local`):**  
ホスト名判定やリダイレクトで失敗する場合は、公式 FAQ のとおり **Host ヘッダー** を合わせます ([Studio FAQ — ngrok / トンネル](https://developer.wordpress.com/docs/developer-tools/studio/frequently-asked-questions/) の考え方は CloudFlare でも同型)。

利用する `cloudflared` のバージョンでフラグ名が異なる場合は `cloudflared tunnel --help` を正とします。

```bash
cloudflared tunnel --url http://mysite.wp.local --http-host-header mysite.wp.local
```

3. ログの **`https://….trycloudflare.com`** を控える (セッションごとに変わる)。

**推奨:** まず **WordPress の `home` / `siteurl` を変えず** に、Webhook 受信だけ試す。リダイレクトや REST URL がずれる場合に [§6.2](#62-wordpress-の-url-整合) に進む。

### 6.2. WordPress の URL 整合

トンネル URL を **サイトアドレス** として WordPress に認識させる (検証セッション中のみでよい)。

* **WP-CLI (Local Site Shell 推奨):**

```bash
wp option update home 'https://<tunnel-host>.trycloudflare.com'
wp option update siteurl 'https://<tunnel-host>.trycloudflare.com'
```

* プラグインが `admin_url` / `rest_url` / OAuth `redirect_uri` を生成する場合、上記更新後に **管理画面を再読み込み** する。
* 検証終了後、Local 用の `home` / `siteurl` に **戻す** (変更前の値をメモしておく)。

### 6.3. 外部サービス側 (Zoom 例)

* **Webhook 受信先:**
    * `https://<tunnel-host>.trycloudflare.com/wp-json/<namespace>/v1/webhook` を Event Subscriptions に登録する。
* **OAuth:**
    * Redirect URL / Allow list に **`https://<tunnel-host>.trycloudflare.com/...`** を **そのセッション分だけ** 追加する。
* **Zoom Webhook:**
    * URL 検証 (challenge) と **署名検証** を実装する。成功ステータスを返すだけでは不十分 ([Zoom Webhooks 公式](https://developers.zoom.us/docs/api/webhooks/))。
* **秘密鍵:**
    * Client Secret / Webhook Secret / Token は `.env` 等に置き、ログ・`test-results.md`・スクリーンショットに **載せない**。

### 6.4. テスト実施と記録

* `./docs/status.md` の **HTTPS 環境でのみテスト可能なこと** を手動で Pass し、`[x]` + [test-results.md](./test-results.md) に **日付・トンネルホスト・項目 ID** を書く。
* 自動化は [`SMOKE_AND_WP_ENVIRONMENTS.md`](./SMOKE_AND_WP_ENVIRONMENTS.md) §5.2のとおり **限定的** (トンネル URL は再起動で変わる)。

**どのログを見るか:** トンネル **経由** (Zoom → WordPress Webhook 等) は `cloudflared` と WordPress 側のログ。**送信** (端末 → Zoom API、Composer ライブラリの CLI) はトンネルに載らない。PHP / [Guzzle](https://docs.guzzlephp.org/en/stable/) の出力・ログを使う。いずれも **Authorization / 秘密鍵 / 個人情報はマスク** する。

#### 6.4.1. `cloudflared` のログ

* **どこ:** `cloudflared tunnel --url ...` を実行した **ターミナルの標準出力 / 標準エラー** (フォアグラウンド起動のまま試す)。
* **何が見えるか:** トンネル URL の発行、リクエストのプロキシ状況、エラー (オリジン unreachable、TLS 等)。HTTP ボディの詳細までは **出ない** ことが多い。
* **詳細度:** 切り分け中だけ `--loglevel debug` 等を付ける (`cloudflared tunnel --help` を正とする)。**終わったら** debug 付きプロセスを Ctrl+C でやめ、次回起動では **フラグを外して通常ログ** に戻す (debug のまま長時間公開しない。ログ量増・公開 URL はそのまま)。
* **Webhook 再送:** Zoom 側のダッシュボード再送と、WordPress 側ログを **時刻で突合** する (ngrok Inspector 相当の UI は Quick Tunnel にはない)。

#### 6.4.2. WordPress / プラグインのデバッグログ

* **有効化 (検証サイトのみ):** `wp-config.php` で `WP_DEBUG` / `WP_DEBUG_LOG` を true にし、`wp-content/debug.log` に書く ([WordPress デバッグ](https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/))。本番相当データでは使わない。
* **REST / Webhook:** プラグインの REST コールバック内で、受信メソッド、ルート、HTTP ステータス、検証結果 (challenge / 署名 OK / NG) を **構造化して** 記録する。生 body 全文や `Authorization` ヘッダーは **ログに出さない** (製品 `status.md` / セキュリティレビューと一致させる)。
* **Local の場所:** サイトルート `wp-content/debug.log` (Local → サイト → **Go to site folder** → `app/public/wp-content/`)。
* **WP-CLI:** `wp eval` や `wp option get` で **URL や非秘密の設定** を確認するのは可。Client Secret / Webhook Secret / アクセストークン / API キー等を、ターミナルに `var_dump`・`print_r`・オプション丸ごと出力 **しない** (「秘密の dump」= 資格情報の丸出し全般。秘密鍵だけに限らない)。
* **プラグインから Zoom に送信:** HTTP は多くの場合 `wp_remote_*` アダプタ ([`SPECS.md`](./SPECS.md) §2.2)。結果は本節の `debug.log` 等で見る (Guzzle §6.4.4は **Service の CLI 試験** 向け)。

#### 6.4.3. PHP の出力・ログ

* **用途:** Composer ライブラリの **送信試験** (`composer exec php -- tests/...php`)、一時スクリプト、PHPUnit の `--debug` 以外の **手動 smoke**。
* **標準出力:** スクリプト内の `printf` / `echo` で HTTP ステータス、エラーコード、JSON の **要約** (トークン類は出さない)。
* **`error_log`:** CLI でも PHP-FPM でも、`error_log('...')` は環境の PHP ログ設定に従う (Local ではターミナルまたは `php.ini` の `error_log`)。
* **環境変数:** Zoom 等のトークンは `getenv('ZOOM_ACCESS_TOKEN')` から読み、**値そのものを print しない**。

#### 6.4.4. Guzzle の出力・ログ (Service の CLI 試験)

**注 (自動テスト):** S2J ◯◯ Service も WordPress プラグイン S2J ◯◯ も、**自動テストの主役に Guzzle を置くのはベターではない**。デフォルト CI は Service なら PHPUnit + フィクスチャ、プラグインなら `wp_remote_*` 等アダプタのモック / スタブを正とする ([`SPECS.md`](./SPECS.md) §2、各 Service `docs/testing.md`)。Guzzle による HTTP ログや live 呼び出しは **dev 限定・オプトイン** (`require-dev`、手動 smoke、デフォルト `composer test` や本番 `require` には載せない) で足りる。

* **どこに Guzzle があるか:** [Guzzle](https://docs.guzzlephp.org/en/stable/) は **Composer パッケージ**。純ドメイン Service (例: [S2J Webinar Service](https://github.com/stein2nd/s2j-webinar-service)) は Zoom REST を **ドメイン内から直接は呼ばず**、HTTP は **注入アダプタ** に任せる ([`SPECS.md`](./SPECS.md) §2)。そのため Service の `require` に Guzzle が **無い** リポジトリもある。**実 API を CLI smoke で呼ぶ** ときは、**その Service リポジトリ** の `require-dev` や `tests/` 専用スクリプトだけが `guzzlehttp/guzzle` に依存、という分け方が典型。WordPress プラグイン (例: `s2j-webinar`) は Service を `require` し、実行時 HTTP は **`wp_remote_*` アダプタ** であることが多く、**プラグイン側に Guzzle を足す必要はない** (別設計なら例外)。
* **「送信試験の見え方は同型」の意味:** Guzzle の `Response` でも `wp_remote_*` の配列でも、**記録・切り分けで見る項目は同じ** — HTTP ステータス、JSON の要約、401 / 429、タイムアウト。いずれも **端末 → Zoom API** なので `cloudflared` ログには載らない。API の戻り値の **PHP の型** が違うだけで、Pass / Fail の観点はそろえる。
* **最小 (Guzzle を使う CLI):** `$response->getStatusCode()` と body の **要約** (上記 §6.4.3)。`http_errors => false` にして4xx / 5xx も握りつぶさない。
* **開発時のみ (推奨):** Guzzle [Middleware](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html) + `MessageFormatter` 等で、試験用スクリプト **限定** のログ。本番 Service コードパスや CI には載せない。
* **Webhook 受信:** Zoom → WordPress は §6.4.1 / §6.4.2。Guzzle CLI ログでは追えない。

### 6.5. 終了

* `cloudflared` を Ctrl+C で停止する (Quick Tunnel URL は **無効** になる)。
* WordPress の `home` / `siteurl` を Local 用に戻す。
* Zoom 等から **一時登録した Redirect / Webhook URL を削除** する。

## 7. Named Tunnel (任意 / URL 固定)

Quick Tunnel は URL が毎回変わります。Zoom 等の登録変更が頻繁な場合は [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) で **Named Tunnel** + 自前ホスト名を使うことを検討しましょう (独自ドメインと DNS 設定が必要。Qiita 記事に近い **継続公開** 向け)。

* 手順の正本: [Get started](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/)。
* 製品ごとの URL は `docs/SPEC_TEST_AND_CICD.md` または `docs/test-results.md` に書く。

## 8. セキュリティ

* トンネルは **検証中だけ** 開く。弱い管理パスワード・本番データ・不要なプラグインを載せない。
* `trycloudflare.com` は **インターネットから到達可能** である。検証用サイトと、検証用の資格情報に限定する。
* Zoom のトークンや Webhook 秘密鍵を **平文ログに出さない**。
* CI では CloudFlare Tunnel を **前提にしない** (GitHub Actions は wp-env / モック / ステージングで分担)。

## 9. 関連

* [`SMOKE_AND_WP_ENVIRONMENTS.md`](./SMOKE_AND_WP_ENVIRONMENTS.md) — HTTP / HTTPS と自動・手動の担当範囲
* [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) — PHPUnit / 送信側 API 試験 (通常トンネル不要)
* [`SPECS.md`](./SPECS.md) §1.1— WordPress 推奨要件と HTTPS
* 参考 `status.md`: [S2J Webinar](https://github.com/stein2nd/s2j-webinar/blob/main/docs/status.md)、[S2J Webinar Source QR](https://github.com/stein2nd/s2j-webinar-source-qr/blob/main/docs/status.md)、[S2J Inquiry Destination](https://github.com/stein2nd/s2j-inquiry-destination/blob/main/docs/status.md)
