<!--
目的：「テスト戦略、CI/CD」の明文化
-->

# wp-plugin-spec - テスト、CI/CD (ひな型)

* 各プラグインリポジトリ直下の `docs/` フォルダー等にコピーして利用することを想定する。
* コピー後、1行目を `# <plugin-slug> - テスト、CI/CD` に変更すること。
* ファイル名の一例: `docs/SPEC_TEST_AND_CICD.md`

* **目的**:
  * **WordPress プラグイン向け** のテスト戦略を定義する。
* **内容例**:
  * PHPUnit / Playwright / Jest 等の採用方針
  * GitHub Actions のワークフロー構成 (lint / test / build / deploy)
  * `docs/test-results.md` (生成物) の出力
  * 「どのブランチで何が走るか」
* **AI 的メリット**:
  * ワークフロー YAML の部分修正を AI に任せる際に、**守るべき全体方針** を明示できる。

ジョブ名・結果マーク・生成物の共通契約は、`docs/CICD.md` を正とします。本ファイルには、このプラグイン固有のバージョン、導入済みツール、WP テスト環境の有無を書きます。結果マークと生成物の扱いは、`docs/SPECS.md` の「5. テスト」を正とします。

## 1. 目的

* PR 時点で **最低限の品質保証 (Lint / Static Analysis / Unit Test / Build)** を自動化し、レビュー負荷と不具合混入を減らす。
* PHP と JS/TS が混在する前提で、どちらか片方だけが壊れても検知できるようにする。
* 「AI 伴走開発」の前提として、AI 生成コードに対して **機械的なガードレール** を敷く。
* ドメインの純関数は PHPUnit で厚く試し、WordPress I/O はアダプタ側のテストに閉じる。

## 2. 対象プロジェクト

* WordPress プラグイン (WordPress 7.x 系)
* PHP (8.x 系想定)
* Node ツールチェイン (Vite + TypeScript + React + SCSS)
* Gutenberg ブロック / 管理画面 UI / REST API を含み得る

## 3. 結果マークと `docs/test-results.md`

自動テストは、`./docs/test-results.md` で実施済 / 実施残がわかるようにします。

* 本ファイルは **生成物** である。CI (または同等のテストランナー) が書き、人が読む。
* `docs_mod` → `docs` の仕様ライフサイクルには乗せない。手編集しない。
* コミットするかは各リポジトリで決める。生成コマンドと CI ジョブは本仕様に書く。

* WARN には、理由と期限、または「環境 X では検証しない」を必須とする。期限のない WARN を常設しない。
* SKIP は「実行していない」。WARN は「実行したが未達を許容した」。混ぜない。
* プラグイン本体のエラー契約は `WP_Error` / HTTP / notice / JS 表示である。exit code は本ワークフローなどのスクリプトに限る。

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
| Playwright | 管理画面・ブロックの E2E | 環境依存は SKIP または WARN (理由必須) |

## 4. 推奨ワークフロー (ジョブ設計)

### 4.1. 最小構成 (ベター・プラクティス)

* **`lint-php`**
  * PHP 構文チェック
  * PHPCS (WPCS もしくは WP コーディング規約準拠のルール)
* **`lint-js`**
  * `npm ci`
  * TypeScript 型チェック (`tsc --noEmit` 等)
  * ESLint / Stylelint
* **`test-phpunit`** (テストがある場合)
  * PHPUnit。ドメイン (`includes/domain/`) は WP なしで走らせることを優先する
  * WP 依存があるなら WP テスト環境を用意する。用意できないジョブは SKIP とし、理由を `test-results.md` に書く
* **`build-assets`**
  * `npm run build:production` (または等価の本番ビルド)
* **`write-test-results`** (任意だが推奨)
  * 上記ジョブの結果から `docs/test-results.md` を生成する

### 4.2. 推奨構成 (ベスト・プラクティス)

* **`static-analysis-php`** (任意だが強力)
  * PHPStan / Psalm のいずれか (導入済みなら必須ジョブ化)
* **`e2e`** (UI 変更が多い場合)
  * Playwright (`wp-env` / Docker / Local サイト等、どれで立ち上げるかはプロジェクト次第)
  * ランナーがない CI では SKIP (環境名と理由を記録)
* **`release`** (タグ push 時)
  * Zip パッケージ作成 (配布形態に合わせる)
  * GitHub Release への添付 (任意)

## 5. このプラグイン固有の記入欄

共通契約は、`CICD.md`。下記だけプラグイン側で埋めます。

* Node バージョン:
* PHP バージョン:
* Composer の有無:
* PHPCS / PHPUnit / PHPStan の導入状況:
* WP テスト環境の有無と起動方法:
* Playwright の有無と起動方法:
* `docs/test-results.md` を Git 管理するか:
* `vendor/` を Zip に同梱するか:
* 共通仕様を上書きする場合の理由:

## 6. ワークフローのテンプレート (最小構成例)

これは **方針を示すテンプレート** です。各プラグイン側の scripts 名に合わせて調整してください。

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
      # PHPCS を使うなら (導入済み前提):
      # - run: vendor/bin/phpcs

  test-phpunit:
    runs-on: ubuntu-latest
    needs: [lint-php]
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      # ドメイン純関数は WP なしで実行できる構成を優先
      # - run: vendor/bin/phpunit --testsuite domain
      # WP テスト環境の用意 (wp-env / mysql サービス等) はプロジェクト次第
      # - run: vendor/bin/phpunit
```

## 7. 運用ルール (AI 伴走開発と CI の統合)

* AI に実装を依頼する際は、PR テンプレートやプロンプトで「CI を通す (lint/test/build を壊さない)」ことを明示する。
* ドメイン判断をアダプタに足さない。テスト追加は純関数側を優先する。
* 仕様の変更が CI に影響する場合 (例: scripts 名の変更、PHP バージョン変更) は、`SPEC_TEST_AND_CICD.md` を先に更新してからワークフローを変更する。

## 8. 今後の作業 ToDo (このリポジトリ側の、次ステップ案)

ここは「提案」です。実施タイミングは、別途で OK です。

* `docs/CICD.md` を本ひな型で置き換え、Swift 文脈の正本を archive する
* 最小構成ワークフローを WordPress プラグイン用にテンプレート化 (`.github/workflows/` のサンプルとして)
* `docs/test-results.md` を生成するスクリプトのサンプルを追加する
* PHPCS / PHPUnit / Playwright を「どの条件で必須にするか」を各プラグインの本ファイルに明記する
