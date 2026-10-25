# wp-plugin-spec - スモークテストと WordPress 環境 (3段階)

* 本ドキュメントは、プラグイン開発における **「実 WordPress サイトでのスモーク」** と **「PHPUnit 用のテスト DB」** を混同しないための共通方針です。
* Docker / wp-env は **必須ではありません**。ローカルでは Local や WordPress Studio を使い、CI だけ wp-env 等を使う構成を許容します。
* 各プラグインのチェックリスト、コマンド、結果記録は `./docs/test-results.md` (生成物または人が追記する運用ログ) に書きます。本書は **環境の役割** の正本です。

## 1. 3つの環境を区別する

A は「人が触る WordPress」。C は **開発用サイトの DB を直接書き換えない** 別系統です。

| 層 | 何を用意するか | 典型ツール |
| --- | --- | --- |
| **A. 実 WordPress サイト** | 本体、PHP、DB、プラグイン配置 | Local、WordPress Studio |
| **B. スモークの自動実行** | 有効化、WP-CLI、HTTP、ログ | WP-CLI スクリプト (任意) |
| **C. PHPUnit / CI** | テストライブラリ、**テスト専用 DB** | PHPUnit、`install-wp-tests.sh`、GitHub Actions + wp-env |

## 2. 段階的導入 (推奨)

| 段階 | 目的 | 主な環境 | 自動化の例 |
| --- | --- | --- | --- |
| **1** | プラグインが WordPress 上で最低限動く | **Local** (日常開発) | 手動スモーク、`wp plugin activate` / `wp plugin is-active` (シェル) |
| **2** | 同じ構成の検証サイトを繰り返し用意 | **WordPress Studio** + Blueprints | `studio wp …`、Blueprint からサイト生成 |
| **3** | PHP / REST / DB 連携、PR ゲート | **PHPUnit** + CI | `composer test`、`npm run test:unit:php` (wp-env) |

段階1と2はスモーク (サイト上の動作) テストで、段階3は PHPUnit (テスト DB) とします。

Playwright 等の E2E は、UI 変更が多いプラグインで段階1の補完として追加します (`TEST_AND_CICD_TEMPLATE.md`)。

ドメイン純関数は WordPress なしで PHPUnit する構成を優先します (`SPECS.md` §5、`CICD.md`)。

### 2.1. Local (段階1)

* **役割:** いつもの開発、手動結合の確認、Site Shell からの WP-CLI。
* **向いていること:** 実装中のすばやい確認、メディア・管理画面、および REST の目視。
* **向いていないこと:** WP / PHP バージョン差のマトリックスを毎回ゼロから再現すること (段階2に任せる)。

### 2.2. WordPress Studio (段階2)

Local と Studio は **代替関係ではなく併用** です (Local = 日常、Studio = 検証工場)。

* **役割:** **クリーンな再現用** 検証サイト。Local 開発サイトを汚さず、バージョン差や依存プラグイン同梱を固定する。
* **向いていること:** [Blueprints](https://developer.wordpress.com/docs/developer-tools/studio/blueprints/) で構成を JSON 化、[Studio CLI](https://developer.wordpress.com/docs/developer-tools/studio/cli/) で操作をスクリプト化。
* **配置の目安:** 各プラグインリポジトリの `studio/` (Blueprint JSON と README)。

### 2.3. PHPUnit (段階3)

* **役割:** `WP_UnitTestCase` による単体・統合テスト。**テスト専用 MySQL** を使用する ([ユニットテスト handbook](https://developer.wordpress.org/apis/handbook/configuring-unit-tests/))。
* **ローカル (wp-env なし):** Local の MySQL (user / password / socket) に接続し、**テスト用 DB 名** (`wordpress_test` 等) のみを使う。開発サイト DB (`local` 等) には書き込まない。手順の正本は [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) (`svn` / MySQL クライアント、`.env.tests`、下準備)。
* **CI:** wp-env / Docker で PHPUnit を回す。開発者 PC に Docker がなくてよい。

## 3. 各プラグインへの落とし込み

1. `docs/test-results.md` に、段階1の手動チェックリスト (または PASS 表) を書く。
2. Studio を使う場合は `studio/README.md` と Blueprint の置き場を宣言する。
3. `docs/SPEC_TEST_AND_CICD.md` (`TEST_AND_CICD_TEMPLATE.md` 由来) に、PHPUnit の有無、CI ジョブ、`WP_TESTS_DIR` / wp-env の起動方法を書く。
4. 結果は `docs/test-results.md` の表で段階、環境、Pass/Fail を追記する (生成物運用の場合は、CI が書く列と人が書く列を分けてよい)。
5. `./docs/status.md` に **100% 完了条件チェックリスト** を置き、**非 HTTPS** と **HTTPS** (または **Local 可 / 要 HTTPS**) を見出しで分ける ([S2J Webinar 例](https://github.com/stein2nd/s2j-webinar/blob/main/docs/status.md))。Composer ライブラリも同型 ([S2J Webinar Service 例](https://github.com/stein2nd/s2j-webinar-service/blob/main/docs/status.md))。

## 4. 参考実装

* [s2j-media-library-date-corrector](https://github.com/stein2nd/s2j-media-library-date-corrector)
    * 段階1: `tests/smoke-local.sh` (`npm run test:smoke:local`)。結果: `docs/test-results.md`
    * 段階2: `studio/smoke-test-blueprint.json`
    * 段階3: [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) 準拠 (`bin/phpunit-local.sh`、`.env.tests`)、CI は wp-env

## 5. HTTP / HTTPS とテストの担当範囲

**非 HTTPS:** サイトを `http://localhost` / `http://127.0.0.1:<port>` (Local / Studio) で動かしたまま完結する項です。

**一時 HTTPS:** 公衆 HTTPS URL (本書では [Cloudflare Tunnel](./CLOUDFLARE_TUNNEL.md) を前提) が必要な項です。段階1–3と直交します (例: 段階3での PHPUnit の大半は、非 HTTPS のまま完了する)。

製品ごとの `[ ]` 正本は `./docs/status.md` です。「自動で Pass を取る」か「手動のみか」は下表の **共通指針** と、各製品 checklist の Test 行を合わせて判断します。

### 5.1. 非 HTTPS 環境

**Local 可 (E*):** localhost で REST / UI まで Pass できるが、のちに **要 HTTPS** の OAuth / 実 Zoom 取り込み (E1/E3等) が残る項です ([Webinar / Source QR status](https://github.com/stein2nd/s2j-webinar-source-qr/blob/main/docs/status.md#status-external))。

| 区分 | 自動テストで可能なこと | 自動テストで不可能 (または非推奨) なこと |
| --- | --- | --- |
| **Composer ライブラリ** | 公開 API の PHPUnit 全件、PHPStan、PHPCS、`docs-lint`、CI `php-quality` ([Inquiry Destination Service 非 HTTPS §](https://github.com/stein2nd/s2j-inquiry-destination-service/blob/main/docs/status.md)) | プラグイン結合、実 WordPress、`wp_mail` 到達、ステージング SaaS 実 API |
| **WordPress プラグイン — 段階3** | ユニット PHPUnit (DB 不要)、統合 PHPUnit (**テスト専用 DB**、[`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md))、`lint:php`、CI wp-env PHPUnit | サイト URL が **公衆 HTTPS** であることの検証、OAuth コールバック完了、外部 Webhook 着信 |
| **WordPress プラグイン — 段階1–2** | `npm run test:smoke:local` (WP-CLI / HTTP 到達)、Studio Blueprint 生成の CLI 部分 | ブラウザのみの UI 確認 (手動 checklist)、Zoom Marketplace の OAuth 同意画面 |
| **HTTP で外向き API** | `wp_remote_*` を **モック** した PHPUnit / 固定レスポンスの結合テスト | ステージング資格情報での **実 API** Pass (製品は HTTPS § に。Inquiry Destination プラグイン [§ HTTPS](https://github.com/stein2nd/s2j-inquiry-destination/blob/main/docs/status.md#status-https)) |
| **メール** | `wp_mail` を filter で差し替えた PHPUnit、MailHog 等への SMTP 自動確認 (製品が採用する場合) | 本番 SMTP / 受信箱到達の **運用確認** (HTTPS サイト上の E2E に寄せることが多い) |

### 5.2. 一時 HTTPS 環境 (CloudFlare Tunnel 前提)

セットアップ手順の正本: [`CLOUDFLARE_TUNNEL.md`](./CLOUDFLARE_TUNNEL.md)。

| 区分 | 自動テストで可能なこと | 自動テストで不可能 (手動 checklist 正本) なこと |
| --- | --- | --- |
| **CI** | 原則 **走らせない** (トンネル URL が固定でない、秘密情報を Actions に置きにくい) | OAuth ブラウザフロー、Webhook 着信、実 Zoom sync / Survey attach |
| **ローカル + トンネル** | トンネル URL を env に渡した **限定的** curl / WP-CLI (製品がスクリプト化した場合のみ。URL 変更で壊れやすい) | Zoom OAuth (E1)、Webhook (E3)、実 API 成功の **目視**、Redirect URI 登録後のブラウザ操作 |
| **記録** | — | Pass は `./docs/test-results.md` に **日付・トンネルホスト・製品 status ID** を書く |

### 5.3. 推奨実施順 (要約)

[S2J Webinar §推奨テスト実施順](https://github.com/stein2nd/s2j-webinar/blob/main/docs/status.md#status-test-order) と同型。

1. **非 HTTPS** — 段階3a/3b 自動 (ユニット → `test:unit:php:local`)、smoke、`lint:php`、CI。
2. **非 HTTPS** — 段階2Studio 手動 checklist (OAuth 項目は SKIP 可)。
3. **一時 HTTPS** — `./docs/status.md` の HTTPS § だけを [Cloudflare Tunnel](./CLOUDFLARE_TUNNEL.md) 上で実施し Pass 記録。

## 6. 関連ドキュメント

* [`SPECS.md`](./SPECS.md) §1.1 / §5— WordPress 推奨要件、テスト
* [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) — wp-env なし Local PHPUnit
* [`CLOUDFLARE_TUNNEL.md`](./CLOUDFLARE_TUNNEL.md) — 一時 HTTPS
* [`CICD.md`](./CICD.md)
* [`TEST_AND_CICD_TEMPLATE.md`](./TEST_AND_CICD_TEMPLATE.md)
