<!-- 
目的：「テスト戦略、CI/CD」の明文化
 -->

# SPEC_TEST_AND_CICD.md (提案｜テスト、CI/CD)

> 各プラグインリポジトリ直下の `docs/` フォルダ等にコピーして利用することを想定しています。
> ファイル名の一例: `docs/SPEC_TEST_AND_CICD.md`

> `docs/COMMON_SPEC_CICD.md` は現状 Swift/SwiftUI 前提の複製であるため、WordPress プラグイン開発 (PHP + Node + ブロック/管理画面) 向けに **置き換える／作り直す** ための提案書です。  
> 各プラグインリポジトリ側では、この方針を `docs/SPEC_TEST_AND_CICD.md` として採用し、必要に応じてワークフローを具体化してください。

* **目的**:
  * **WordPress プラグイン向け** のテスト戦略を定義する。
* **内容例**:
  * PHPUnit / Playwright / Jest 等の採用方針
  * GitHub Actions のワークフロー構成 (lint / test / build / deploy)
  * 「どのブランチで何が走るか」
* **AI 的メリット**:
  * ワークフロー YAML の部分修正を AI に任せる際に、**守るべき全体方針** を明示できる。

---

## 1. 目的

* PR 時点で **最低限の品質保証 (Lint / Static Analysis / Unit Test / Build)** を自動化し、レビュー負荷と不具合混入を減らす。
* PHP と JS/TS が混在する前提で、どちらか片方だけが壊れても検知できるようにする。
* 「AI 伴走開発」の前提として、AI 生成コードに対して **機械的なガードレール** を敷く。

---

## 2. 対象プロジェクト

* WordPress プラグイン (WordPress 6.x 系)
* PHP (8.x 系想定)
* Node ツールチェイン (Vite + TypeScript + React + SCSS)
* Gutenberg ブロック / 管理画面 UI / REST API を含み得る

---

## 3. 推奨ワークフロー (ジョブ設計)

### 3.1. 最小構成 (ベター・プラクティス)

* **`lint-php`**
  * PHP 構文チェック
  * PHPCS (WPCS もしくは WP コーディング規約準拠のルール)
* **`lint-js`**
  * `npm ci`
  * TypeScript 型チェック (`tsc --noEmit` 等)
  * ESLint / Stylelint
* **`test-phpunit`** (テストがある場合)
  * PHPUnit (WP 依存があるなら WP テスト環境を用意)
* **`build-assets`**
  * `npm run build:production` (または等価の本番ビルド)

### 3.2. 推奨構成 (ベスト・プラクティス)

* **`static-analysis-php`** (任意だが強力)
  * PHPStan / Psalm のいずれか (導入済みなら必須ジョブ化)
* **`e2e`** (UI 変更が多い場合)
  * Playwright (`wp-env` / Docker / Local サイト等、どれで立ち上げるかはプロジェクト次第)
* **`release`** (タグ push 時)
  * Zip パッケージ作成 (配布形態に合わせる)
  * GitHub Release への添付 (任意)

---

## 4. 具体的な改修ポイント (現 `COMMON_SPEC_CICD.md` → WP 向け)

現ファイルの Swift 特有部分を削除し、次の章立てへ置き換えるのを推奨します。

### 4.1. 「環境」章を WP/Node 前提へ

* Node のセットアップ (`actions/setup-node@v4`、キャッシュ有効化)
* PHP のセットアップ (`shivammathur/setup-php@v2`)
* Composer を使う場合は `composer install --no-interaction --prefer-dist`

### 4.2. 「成果物」章を Zip 配布へ

* GitHub リポジトリは private を基本とする (OSS 化時は public に切り替え)。
* リリースは GitHub Release + Zip Export で配布可能とする。
* `dist/` は Git 管理対象外とし、リリース時にビルドして Zip に含める。
* `vendor/` を同梱するかは配布先 (WordPress.org / GitHub Releases / クライアント納品) で方針を分ける。
* バージョン番号は Semantic Versioning (SemVer) に準拠。

### 4.3. 「テスト」章を二言語 (PHP + JS) で定義

* PHP:
  * `php -l` (任意)
  * PHPCS (WPCS)
  * PHPUnit (WP テスト環境の有無を明記)
* JS:
  * `npm ci`
  * `npm run lint`
  * `npm run build:production`
  * (任意) `npm test` (Jest/Vitest)

### 4.4. 「キャッシュ」章を Node/Composer へ

* Node: npm キャッシュ
* Composer: vendor キャッシュ (プロジェクト規模による)

---

## 5. ワークフローのテンプレート (最小構成例)

> これは **方針を示すテンプレート** です。各プラグイン側の scripts 名に合わせて調整してください。

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
      # WP テスト環境の用意 (wp-env / mysql サービス等) はプロジェクト次第
      # - run: vendor/bin/phpunit
```

---

## 6. 運用ルール (AI 伴走開発と CI の統合)

* AI に実装を依頼する際は、PR テンプレートやプロンプトで「CI を通す (lint/test/build を壊さない)」ことを明示する。
* 仕様の変更が CI に影響する場合 (例: scripts 名の変更、PHP バージョン変更) は、`SPEC_TEST_AND_CICD.md` を先に更新してからワークフローを変更する。

---

## 7. 今後の作業 ToDo (このリポジトリ側の、次ステップ案)

> ここは「提案」です。実施タイミングは別途で OK です。

* `docs/COMMON_SPEC_CICD.md` を WP 向けにリライト (Swift 文脈の削除)
* 最小構成ワークフローを WordPress プラグイン用にテンプレート化 (`.github/workflows/` のサンプルとして)
* `PHPCS (WPCS) / PHPUnit / Playwright` の推奨ツールセットをドキュメント化 (どの条件で必須にするかも明記)
