# wp-plugin-spec - CI/CD 共通仕様

* 本ドキュメントでは、WordPress プラグイン向けの CI/CD ワークフローの共通仕様を定義する。
* GitHub Actions を使用したパイプラインを想定する。
* 各プラグイン固有のジョブ名、PHP バージョン、WP テスト環境の有無は、`docs/SPEC_TEST_AND_CICD.md` (ひな型: `TEST_AND_CICD_TEMPLATE.md`) に書く。
* 結果マークと `docs/test-results.md` (生成物) の扱いは、`docs/SPECS.md` の「5. テスト」を正とする。

## 1. 目的

* PR 時点で Lint / 静的解析 / ユニットテスト / 本番ビルドを自動化し、レビュー負荷と不具合混入を減らす。
* PHP と JS/TS が混在する前提で、どちらか片方だけが壊れても検知できるようにする。
* ドメインの純関数は PHPUnit で厚く試し、WordPress I/O はアダプタ側のテストに閉じる。
* プラグイン本体のエラー契約は `WP_Error` / HTTP / notice / JS 表示である。exit code は本ワークフローなどのスクリプトに限る。

## 2. 対象プロジェクト

* WordPress プラグイン (WordPress 7.x 系)
* PHP (8.x 系想定)
* Node ツールチェイン (Vite + TypeScript + React + Dart SASS)
* Gutenberg ブロック / 管理画面 UI / REST API を含み得る

## 3. 結果マークと生成物

自動テストは、各リポジトリの `./docs/test-results.md` で実施済 / 実施残がわかるようにします。

* 本ファイルは **生成物** である。CI (または同等のテストランナー) が書き、人が読む。
* `docs_mod` → `docs` の仕様ライフサイクルには乗せない。手編集しない。
* コミットするかは各リポジトリで決める。生成コマンドと CI ジョブは `SPEC_TEST_AND_CICD.md` に書く。

* WARN には、理由と期限、または「環境 X では検証しない」を必須とする。期限のない WARN を常設しない。
* SKIP は「実行していない」。WARN は「実行したが未達を許容した」。混ぜない。

| マーク | 意味 |
| --- | --- |
| PASS | 条件を満たす |
| WARN | 条件未達だが、意図的に許容する |
| SKIP | 環境がなく、今回は実行しない |
| PENDING (自動) | 自動テスト未実装 |
| FAIL | 条件未達 (要修正) |

### 3.1. 対象の分類

| 対象 | 主目的 | 未達時の目安 |
| --- | --- | --- |
| PHPUnit | ドメイン純関数を厚くする。アダプタは薄い結合テスト | FAIL は要修正。WP テスト環境がないジョブは SKIP |
| PHPCS / PHPStan | 規約と静的解析 | FAIL |
| ESLint / `tsc` | JS/TS の規約と型 | FAIL |
| Docs Linter | 仕様書の表記 | FAIL |
| Playwright | 管理画面・ブロックの E2E | 環境依存は SKIP または WARN (理由必須) |

## 4. ワークフロー概要

### 4.1. 基本構成

最小構成 (ベター・プラクティス) は、下記のジョブとします。

1. **`lint-js`**: `npm ci`、ESLint / Stylelint、`tsc --noEmit`、本番ビルド
2. **`lint-php`**: PHP 構文、PHPCS (WPCS)
3. **`test-phpunit`**: ドメインを優先。WP 依存は環境があるときだけ
4. **`write-test-results`** (推奨): `docs/test-results.md` を生成

推奨構成 (ベスト・プラクティス) は、下記を足します。

* **`static-analysis-php`**: PHPStan / Psalm (導入済みなら必須)
* **`e2e`**: Playwright。ランナーがない CI では SKIP
* **`release`**: タグ push 時の Zip。`dist/` はビルドして同梱。`vendor/` 同梱は配布先で分岐

### 4.2. 実行条件

* **`push`**: `main` および `develop` ブランチへのプッシュ時に実行
* **`pull_request`**: `main` および `develop` ブランチへのプルリクエスト時に実行
* **マージ条件**: FAIL がないこと。WARN / SKIP は `test-results.md` に理由があること

### 4.3. Git 管理対象

* `.github/workflows` などの CI 設定ファイルは Git 管理対象
* ビルドキャッシュ、`dist/`、`vendor/` は Git 管理しない (配布 Zip への同梱はリリース時)
* `docs/test-results.md` をコミットする場合は、生成物であることを明示する

## 5. 共通ステップ

### 5.1. Checkout

ドキュメント lint がサブモジュールの `tools/docs-linter` に依存する場合は、`submodules: true` を付けます。

```yaml
- name: Checkout
  uses: actions/checkout@v4
```

### 5.2. Node

バージョンは、各プラグインの `SPEC_OVERVIEW.md` に合わせます。

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
- run: npm ci
```

### 5.3. PHP / Composer

* Composer 未使用のプラグインは、`composer install` を省略してよい。PHPCS / PHPUnit の導入方法は、`SPEC_TEST_AND_CICD.md` に書く。

```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: '8.2'
- run: composer install --no-interaction --prefer-dist
```

## 6. ジョブ仕様

### 6.1. `lint-js`

* `npm run lint` (ESLint / Stylelint)
* 型チェック (`tsc --noEmit` または `npm` script に含める)
* `npm run build:production` (または等価)。成果物は Git に含めない

### 6.2. `lint-php`

* `php -l` (任意)
* `vendor/bin/phpcs` (WPCS)。未導入なら PENDING (自動) とし、導入期限を Backlog に書く

### 6.3. `test-phpunit`

* ドメイン (`includes/domain/`) は、WordPress なしで実行できる構成を優先する
* WP テスト環境 (wp-env / MySQL サービス等) が必要なテストは、環境がないジョブでは SKIP し、理由を `test-results.md` に書く
* アダプタ (REST / Settings / `$wpdb`) のテストは薄くする。判断ロジックをここに置かない

### 6.4. `e2e`

* Playwright を標準とする
* 起動方法 (`wp-env` / Docker / Local) はプラグインごとに `SPEC_TEST_AND_CICD.md` へ
* 環境依存で実行できない場合は SKIP。条件未達を許容する場合は WARN (理由と期限必須)

### 6.5. `release`

* バージョン番号は、Semantic Versioning に準拠
* `dist/` は、リリース時にビルドして Zip に含める
* `vendor/` を同梱するかは、WordPress.org / GitHub Releases / 社内配布で分岐する
* GitHub リポジトリは、private を基本とする (OSS 化時は public に切り替え)

## 7. 品質保証と CI 連携

### 7.1. 自動検査ツール

| ツール | 検査対象 | 実行タイミング |
| --- | --- | --- |
| Docs Linter (`@s2j/docs-linter`) | ドキュメントの表記 | PR 時 |
| PHPCS (WPCS) | PHP 規約 | PR 時 |
| PHPStan / Psalm | PHP 静的解析 | PR 時 (導入済みなら) |
| ESLint / Stylelint / `tsc` | JS/TS/CSS | PR 時 |
| PHPUnit | ドメイン純関数、薄いアダプタ試験 | PR 時 |
| Playwright | 管理画面・ブロック | UI 変更が多い場合 |

### 7.2. サードパーティ

CI で使うツールも npm または Composer 経由で導入します。WordPress 本体と `@wordpress/*` は対象外です。

## 8. ワークフローの最小構成例

各プラグイン側の scripts 名に合わせて調整してください。

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-js:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build:production

  lint-php:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      - run: php -v
      - run: composer --version || true
      # composer を使うなら:
      # - run: composer install --no-interaction --prefer-dist
      # - run: vendor/bin/phpcs

  test-phpunit:
    runs-on: ubuntu-latest
    needs: [lint-php]
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      # - run: vendor/bin/phpunit --testsuite domain
```

## 9. ローカルテストとの整合性

* CI と同じ検査をローカルで実行する script を用意することを推奨する (例: `scripts/test-local.sh` または `npm test` / `composer test`)
* bash と zsh の両方で動くようにする
* ドメインの PHPUnit は、WordPress を起動せずに通ることを目標にする

## 10. エラーハンドリング

* カバレッジアップロードなどは、`fail_ci_if_error: false` にしてよい (本体テストは FAIL にする)
* E2E の診断ログは、`if: always()` でアーティファクト保存する
* ジョブ失敗時も、`test-results.md` を書けた範囲で残す

## 11. プロジェクト固有のカスタマイズ

下記は、`SPEC_TEST_AND_CICD.md` に書きます。本共通仕様を上書きする場合は、理由をそこに明記します。

* Node / PHP のバージョン
* Composer の有無、PHPCS / PHPUnit / PHPStan の導入状況
* WP テスト環境の有無
* Playwright の起動方法
* `docs/test-results.md` を Git 管理するか
* `vendor/` を Zip に同梱するか

## Appendix A: 参考資料

* [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
* [WordPress コーディング規約ハンドブック](https://ja.wordpress.org/team/handbook/coding-standards/)
* 各プラグインの `docs/SPEC_TEST_AND_CICD.md`
* 本リポジトリの `docs/TEST_AND_CICD_TEMPLATE.md`
