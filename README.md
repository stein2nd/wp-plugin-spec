# wp-plugin-spec

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[![WordPress](https://img.shields.io/badge/WordPress-6.9+-blue.svg)](https://wordpress.org/)

本リポジトリは、WordPress や Cursor などで **プラグイン** および対になる **Composer ライブラリ** を開発するうえでの **共通仕様** を定義するドキュメント・リポジトリです。

## Description

本リポジトリ配下で開発する WordPress プラグイン (および純ドメインの Composer ライブラリ) において、「AI 伴走開発」を行う際の共通仕様・ルールを定義します。

## 1. 技術スタック

* **言語**: PHP ([WordPress 推奨](https://ja.wordpress.org/about/requirements/) に合わせ **v8.3+**。プラグイン `Requires PHP` と Composer `require.php` をそろえる) / TypeScript
* **UI**: React (Gutenberg / 管理画面)。実行時は WordPress が提供する React を使う
* **対象**: WordPress プラグイン (WordPress v6.9+)。DB は [WordPress 推奨要件](https://ja.wordpress.org/about/requirements/) に準拠 ([`SPECS.md` §1.1](./docs/SPECS.md))
* **ビルド**: Vite + Dart SASS。成果物は `dist/`
* **依存管理**: npm または PHP Composer。WordPress 本体と `@wordpress/*` は対象外
* **テスト**: PHPUnit (ドメインを厚く) + PHPCS / PHPStan + ESLint / `tsc` + Playwright

## 2. 主要な開発ルール

* ドメインの判断は、純関数とし、副作用はアダプタに閉じる。
* WordPress API / DB / HTTP / ファイルは、アダプタに閉じる。
* フック登録、REST、設定画面、ブロック登録は、アダプタであり、クラスを使ってよい。
* 継承と巨大サービス (`FooService` 等) は、使わない。
* エラーは、`WP_Error` / HTTP / notice / JS のエラー表示で表に出す。
* 実装修正の着手は、人間が許可してから実行する。

## 3. コーディング規約

* **WordPress プラグイン** — `includes/` は **PSR-12**、プラグインルートの bootstrap PHP は [WordPress コーディング規約](https://ja.wordpress.org/team/handbook/coding-standards/) (WPCS)。PHPCBF は PSR-12のみ `includes/` に当てる。詳細は [`docs/PHP_CODING_STANDARDS.md`](./docs/PHP_CODING_STANDARDS.md)。
* **Composer ライブラリ** — WPCS は使わず **PSR-12** を正とする。
* TypeScript は、`strict: true` とし、ESLint で検査する。
* アダプタは `includes/` に、ドメインの純関数は `includes/domain/` に置く。
* React は UI アダプタとし、ドメイン判断は `utils/` の純関数に出す。
* 表示文言は、`__()` / `@wordpress/i18n` を通す。ドメインに翻訳文字列を埋め込まない。

## 4. 詳細な仕様

詳細は、[`docs/SPECS.md`](./docs/SPECS.md) を参照してください。関連する別紙は、下記のとおりです。

* [`docs/OVERVIEW_TEMPLATE.md`](./docs/OVERVIEW_TEMPLATE.md) — プロジェクトの存在理由 (ひな型)
* [`docs/ARCHITECTURE_TEMPLATE.md`](./docs/ARCHITECTURE_TEMPLATE.md) — コード構造と責務 (ひな型)
* [`docs/UI_API_DATA_TEMPLATE.md`](./docs/UI_API_DATA_TEMPLATE.md) — 画面 / API / データ (ひな型)
* [`docs/I18N_AND_A11Y_TEMPLATE.md`](./docs/I18N_AND_A11Y_TEMPLATE.md) — 国際化 / アクセシビリティ (ひな型)
* [`docs/TEST_AND_CICD_TEMPLATE.md`](./docs/TEST_AND_CICD_TEMPLATE.md) — テスト / CI/CD (ひな型)
* [`docs/AI_COLLAB_TEMPLATE.md`](./docs/AI_COLLAB_TEMPLATE.md) — AI 伴走開発ルール (ひな型)
* [`docs/DOCUMENTATION_GOVERNANCE_TEMPLATE.md`](./docs/DOCUMENTATION_GOVERNANCE_TEMPLATE.md) — ドキュメント整合、archive 運用 (ひな型。製品では `docs/governance/documentation_governance.md`)
* [`docs/PHP_CODING_STANDARDS.md`](./docs/PHP_CODING_STANDARDS.md) — PHP / PHPCS / PHPCBF (プラグイン vs ライブラリ)
* [`docs/CICD.md`](./docs/CICD.md) — CI/CD
* [`docs/SMOKE_AND_WP_ENVIRONMENTS.md`](./docs/SMOKE_AND_WP_ENVIRONMENTS.md) — スモークと WordPress 環境 (Local / Studio / PHPUnit)
* [`docs/PHPUNIT_LOCAL.md`](./docs/PHPUNIT_LOCAL.md) — PHPUnit (wp-env なし / Local + テスト専用 DB)
* [`docs/CLOUDFLARE_TUNNEL.md`](./docs/CLOUDFLARE_TUNNEL.md) — 一時 HTTPS (OAuth / Webhook 検証)
* [`docs/archive/README.md`](./docs/archive/README.md) — 凍結スナップショットの索引

旧正本・イニシアチブ証跡は、[`docs/archive/`](./docs/archive/) に freeze します。

## License

このプロジェクトは、GPL v3以降の下でライセンスされています - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
