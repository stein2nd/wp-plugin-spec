# WordPress Plugin Development Spec (共通仕様)

本ドキュメントは、本リポジトリ配下で開発する WordPress プラグインに共通する仕様を定義します。  
各プラグインごとの個別仕様は、各リポジトリ内の `SPEC.md` に記載します。

---

## 1. プロジェクト構成

### 1.1 フォルダ構成

各プラグインは、以下のディレクトリ構成を基本とします。

```
plugin-name/  # プラグインフォルダー
├─ `package.json` # ビルド設定
├─ `SPEC.md` # プラグイン固有仕様
├─ `vite.config.ts`
├─ `tsconfig.json`
├─ `LICENSE`
├─ `readme.md`
├─ plugin-name.php # プラグイン本体
├─ `uninstall.php` # プラグイン削除時の処理
├─ includes/ # PHPクラス群 (REST, Settings, Admin UI)
├─ src/ # TypeScript/React/SCSS ソース
├─ dist/ # Vite ビルド成果物 (Git管理外)
└─ languages/ # 翻訳ファイル (.pot, .po, .mo)
```

* プラグインフォルダー名、プラグイン本体のファイル名、テキストドメイン名は、一致する必要があります。
* その名称に利用できる文字種については下記の範囲になり、スペースは除去する必要があります。
  * アンダースコアの代わりに、ダッシュを使用
  * 小文字

---

## 2. 開発環境

* Node.js v18+
* npm v9+
* Vite + TypeScript + React + SCSS
* WordPress 6.x 系を対象
* ローカル開発は「Local by Flywheel」または同等の環境を利用すること

---

## 3. ビルド要件

* Vite + TypeScript + SCSS
  * `vite.config.ts` を用いて IIFE 形式でバンドルする
  * JavaScript は WordPress 同梱の jQuery を利用可能とする （外部 import 不要） (`jQuery(function($) { ... })`)
  * CSS も IIFE 出力し、エディタ用・フロント用を区別すること
* 出力は `./dist`

### 3.1 `package.json` の `scripts`

* `npm run build:dev` → 開発用ビルド（minify 無効）
* `npm run build:production` → 本番用ビルド（minify 有効）

---

## 4. 準拠ドキュメント

* [WordPress コーディング規約ハンドブック](https://ja.wordpress.org/team/handbook/coding-standards/)
* [WordPress プラグイン開発ハンドブック](https://ja.wordpress.org/team/handbook/plugin-development/)

---

## 5. 国際化

* テキストはすべて `__()` / `_e()` / `_x()` を適切に使用
* 翻訳ファイルは `languages/` に配置
* 翻訳テンプレート `.pot` は `wp i18n makepot` により生成
* Text Domain は plugin-slug に合わせる

---

## 6. PHP コード規約

* クラスベースで実装し、名前空間衝突を避ける
* クラス命名規則: `Vendor_Plugin_Function` 形式 (例: `S2J_SlugGenerater_REST`) 
* WordPress コーディング規約 (PHPCS, WPCS) に準拠
* 主要な機能はクラスにまとめ、`includes/` に配置すること

---

## 7. 管理画面仕様

* 設定ページは `add_options_page` または `add_menu_page` を利用
* 設定値は `register_setting` / `get_option` / `update_option` を利用
* API キー等は WordPress Options API に保存
* セキュリティ上の理由から、必ず `sanitize_callback` を設定

---

## 8. REST API 仕様

* すべての REST エンドポイントは `/plugin-slug/v1/...` を基本とする
* `permission_callback` で権限チェックを必ず行う
* Nonce チェックを必須とする
* 外部 API（例: DeepL）を利用する場合は、`wp_remote_post` / `wp_remote_get` を利用し、エラーハンドリングを実装する

---

## 9. Gutenberg ブロック仕様

* [ブロックエディターハンドブック](https://ja.wordpress.org/team/handbook/block-editor/) に準拠する
* ブロックは `src/` に実装し、`register_block_type` で `dist/` 出力物を読み込む
* `edit` 側は React Hooks を利用
* 翻訳文字列は `@wordpress/i18n` を利用 (`__()`, `_x()`)
* `save` は必要に応じて実装するが、REST 経由の処理が多いため `null` 戻りが基本

---

## 10. Classic エディタ対応（必要な場合）

* `assets/classic.js` または `src/classic.ts` に記述
* Classic エディタ専用 UI は `add_meta_box` で提供する

---

## 11. バージョン管理・配布

* `dist/` は Git 管理対象外とする
* GitHub リポジトリは private を基本とする（OSS化時は public に切り替え）
* リリースは GitHub Release + Zip Export で配布可能とする
* バージョン番号は Semantic Versioning (SemVer) に準拠

---

## 12. 今後の拡張（将来フェーズ）

* `templates/` ディレクトリに開発テンプレート一式を配置予定
  * サンプル `vite.config.ts`
  * サンプル `package.json`
  * サンプル `class-rest.php`
* OSS 化を想定し、Public リポジトリ版の `WP_PLUGIN_SPEC.md` を用意予定

---
