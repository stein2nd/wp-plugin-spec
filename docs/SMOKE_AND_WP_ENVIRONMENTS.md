# wp-plugin-spec - スモークテストと WordPress 環境 (3段階)

* 本ドキュメントは、プラグイン開発における **「実 WordPress サイトでのスモーク」** と **「PHPUnit 用のテスト DB」** を混同しないための共通方針です。
* Docker / wp-env は **必須ではありません**。ローカルでは Local や WordPress Studio を使い、CI だけ wp-env 等を使う構成を許容します。
* 各プラグインのチェックリスト、コマンド、結果記録は `./docs/test-results.md` (生成物または人が追記する運用ログ) に書きます。本書は **環境の役割** の正本です。

## 1. 3つの環境を区別する

| 層 | 何を用意するか | 典型ツール |
| --- | --- | --- |
| **A. 実 WordPress サイト** | 本体、PHP、DB、プラグイン配置 | Local、WordPress Studio |
| **B. スモークの自動実行** | 有効化、WP-CLI、HTTP、ログ | WP-CLI スクリプト (任意) |
| **C. PHPUnit / CI** | テストライブラリ、**テスト専用 DB** | PHPUnit、`install-wp-tests.sh`、GitHub Actions + wp-env |

A は「人が触る WordPress」。C は **開発用サイトの DB を直接書き換えない** 別系統です。

## 2. 段階的導入 (推奨)

| 段階 | 目的 | 主な環境 | 自動化の例 |
| --- | --- | --- | --- |
| **1** | プラグインが WordPress 上で最低限動く | **Local** (日常開発) | 手動スモーク、`wp plugin activate` / `wp plugin is-active` (シェル) |
| **2** | 同じ構成の検証サイトを繰り返し用意 | **WordPress Studio** + Blueprints | `studio wp …`、Blueprint からサイト生成 |
| **3** | PHP / REST / DB 連携、PR ゲート | **PHPUnit** + CI | `composer test`、`npm run test:unit:php` (wp-env) |

段階1と2はスモーク (サイト上の動作)。段階3は PHPUnit (テスト DB)。Playwright 等の E2E は、UI 変更が多いプラグインで段階1の補完として追加します (`TEST_AND_CICD_TEMPLATE.md`)。

ドメイン純関数は WordPress なしで PHPUnit する構成を優先します (`SPECS.md` §5、`CICD.md`)。

### 2.1. Local (段階1)

* **役割:** いつもの開発、手動結合の確認、Site Shell からの WP-CLI。
* **向いていること:** 実装中のすばやい確認、メディア・管理画面、および REST の目視。
* **向いていないこと:** WP / PHP バージョン差のマトリックスを毎回ゼロから再現すること (段階2に任せる)。

### 2.2. WordPress Studio (段階2)

* **役割:** **クリーンな再現用** 検証サイト。Local 開発サイトを汚さず、バージョン差や依存プラグイン同梱を固定する。
* **向いていること:** [Blueprints](https://developer.wordpress.com/docs/developer-tools/studio/blueprints/) で構成を JSON 化、[Studio CLI](https://developer.wordpress.com/docs/developer-tools/studio/cli/) で操作をスクリプト化。
* **配置の目安:** 各プラグインリポジトリの `studio/` (Blueprint JSON と README)。

Local と Studio は **代替関係ではなく併用** です (Local = 日常、Studio = 検証工場)。

### 2.3. PHPUnit (段階3)

* **役割:** `WP_UnitTestCase` による単体・統合テスト。**テスト専用 MySQL** を使用する ([ユニットテスト handbook](https://developer.wordpress.org/apis/handbook/configuring-unit-tests/))。
* **ローカル (wp-env なし):** Local の MySQL (user / password / socket) に接続し、**テスト用 DB 名** (`wordpress_test` 等) のみを使う。開発サイト DB (`local` 等) には書き込まない。手順の正本は [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) (`svn` / MySQL クライアント、`.env.tests`、下準備)。
* **CI:** wp-env / Docker で PHPUnit を回す。開発者 PC に Docker がなくてよい。

## 3. 各プラグインへの落とし込み

1. `docs/test-results.md` に、段階1の手動チェックリスト (または PASS 表) を書く。
2. Studio を使う場合は `studio/README.md` と Blueprint の置き場を宣言する。
3. `docs/SPEC_TEST_AND_CICD.md` (`TEST_AND_CICD_TEMPLATE.md` 由来) に、PHPUnit の有無、CI ジョブ、`WP_TESTS_DIR` / wp-env の起動方法を書く。
4. 結果は `docs/test-results.md` の表で段階、環境、Pass/Fail を追記する (生成物運用の場合は、CI が書く列と人が書く列を分けてよい)。

## 4. 参考実装

* [s2j-media-library-date-corrector](https://github.com/stein2nd/s2j-media-library-date-corrector)
    * 段階1: `tests/smoke-local.sh` (`npm run test:smoke:local`)。結果: `docs/test-results.md`
    * 段階2: `studio/smoke-test-blueprint.json`
    * 段階3: [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) 準拠 (`bin/phpunit-local.sh`、`.env.tests`)、CI は wp-env

## 5. 関連ドキュメント

* [`SPECS.md`](./SPECS.md) §5 - テスト
* [`PHPUNIT_LOCAL.md`](./PHPUNIT_LOCAL.md) - wp-env なし Local PHPUnit
* [`CICD.md`](./CICD.md)
* [`TEST_AND_CICD_TEMPLATE.md`](./TEST_AND_CICD_TEMPLATE.md)
