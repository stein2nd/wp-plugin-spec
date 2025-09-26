# WordPress Plugin Development Spec (共通仕様)

* 本ドキュメントは、本リポジトリ配下で開発する WordPress プラグインに共通する仕様を定義します。  
* 各プラグインごとの個別仕様は、各リポジトリ内の `SPEC.md` に記載します。

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

## 7. スタイル規約

* 余白・間隔 (padding, margin, blockGap 等)、テキストサイズ を rem で定義すること

---

## 8. 管理画面仕様

* 設定ページは `add_options_page` または `add_menu_page` を利用
* 設定値は `register_setting` / `get_option` / `update_option` を利用
* API キー等は WordPress Options API に保存
* セキュリティ上の理由から、必ず `sanitize_callback` を設定

---

## 9. REST API 仕様

* すべての REST エンドポイントは `/plugin-slug/v1/...` を基本とする
* `permission_callback` で権限チェックを必ず行う
* Nonce チェックを必須とする
* 外部 API（例: DeepL）を利用する場合は、`wp_remote_post` / `wp_remote_get` を利用し、エラーハンドリングを実装する

---

## 10. Gutenberg ブロック仕様

* [ブロックエディターハンドブック](https://ja.wordpress.org/team/handbook/block-editor/) に準拠する
* ブロックは `src/` に実装し、`register_block_type` で `dist/` 出力物を読み込む
* `edit` 側は React Hooks を利用
* 翻訳文字列は `@wordpress/i18n` を利用 (`__()`, `_x()`)
* `save` は必要に応じて実装するが、REST 経由の処理が多いため `null` 戻りが基本

---

## 11. Classic エディタ対応（必要な場合）

* `assets/classic.js` または `src/classic.ts` に記述
* Classic エディタ専用 UI は `add_meta_box` で提供する

---

## 12. バージョン管理・配布

* `dist/` は Git 管理対象外とする
* GitHub リポジトリは private を基本とする（OSS化時は public に切り替え）
* リリースは GitHub Release + Zip Export で配布可能とする
* バージョン番号は Semantic Versioning (SemVer) に準拠

---

## 13. 今後の拡張（将来フェーズ）

* `templates/` ディレクトリに開発テンプレート一式を配置予定
  * サンプル `vite.config.ts`
  * サンプル `package.json`
  * サンプル `class-rest.php`
* OSS 化を想定し、Public リポジトリ版の `WP_PLUGIN_SPEC.md` を用意予定

---

## Appendix A: Spec Driven Developing Rule (AI 伴走開発)

* 本付録は、Cursor や ChatGPT / Claude などの AI コード補助環境を利用しつつ、**WP_PLUGIN_SPEC.md に準拠した Spec Driven Developing** を行うための運用ルール群を定めるものです。
* 本ガイドラインは必須ではなく、「SPEC を唯一の正典としつつ AI を活用する開発スタイル」を推進するための補助ルールと考えてください。

### 1. 基本原則
1. **SPEC を唯一の正典とする**

  * すべての実装判断、動作仕様、入出力仕様はまず SPEC に記述されていることを前提とします。
  * AI による生成物が SPEC と整合しない場合、SPEC 側を優先し、AI に修正を指示します。

2. **補助仕様 (CLAUDE.md 等) は設計規範／レビュー軸として用いる**

  * プロジェクト固有の設計思想、命名規則、責務分割ルールなどを `CLAUDE.md` に定義しておいてください。  
  * AI に対して“WP_PLUGIN_SPEC.md および SPEC.md および CLAUDE.md に従って実装してください”という旨を常にプロンプトに含めてください。

3. **Prompt 運用ルールを定義・共有する**

  * 各機能あるいはモジュール単位で、標準プロンプト定型テンプレート (雛形) をチームで決めておいてください。
  * Prompt に「参照すべき SPEC のセクション」「設計規範を指定するファイル名 (例：CLAUDE.md)」「禁止事項・注意事項」などを明示してください。
   * 例：「WP_PLUGIN_SPEC.md Appendix B §B.2 に従って、このブロックの保存処理を TypeScript で実装してください。」

4. **AI 出力の自律チェック／レビューを欠かさない**

  * AI が生成したコード／ドキュメントは必ず人がレビューし、SPEC 準拠かをチェックしてください。
  * 特に WordPress API の利用方法 (`wp_nonce_field`, `sanitize_text_field` など) は人間が精査してください。
  * レビュー時には以下観点を最低限確認してください：

    * a) 入出力仕様が合っているか
    * b) 例外処理やエッジケース対応が抜けていないか
    * c) 命名規則・責務分割・モジュール境界が設計方針 (CLAUDE.md) に準じているか
    * d) セキュリティ／パフォーマンス上の懸念点がないか

5. **AI 生成と手動修正の境界を設ける**

  * 単純な CRUD や定型的な処理は AI に生成させ、複雑な制御や設計判断のある箇所は手動実装または人による指示付き生成とします。
  * AI 出力後、必ず人が「なぜその設計になったか」をコメントで残す (AI 理由説明コメント含む)。

6. **継続的な Prompt チューニングと振り返り**

  * AI に出力させたコード品質を定期的に振り返り、プロンプト改善案をチームで共有してください。
  * Prompt による逸脱や誤生成が続く場合、SPEC や CLAUDE.md の記述を再精査し、曖昧性を排除してください。

### 2. Cursor / ChatGPT の活用ルール

* **Cursor**
  * SPEC 準拠の実装補助に活用する。
  * 差分提案・コードリファクタリングを SPEC に沿わせるようプロンプトで明示する。

* **ChatGPT**
  * コード生成やドキュメント化に強み。
  * 生成後レビューで SPEC 逸脱がないかチェックする。

### 3. Claude の活用ルール

* 長文コンテキスト・設計レビューに活用する。
* プラグイン全体構成や国際化対応 (`__()`、`wp_set_script_translations` など) の一貫性をチェックさせる。
* 「SPEC.md と CLAUDE.md の不一致箇所を抽出してください」と指示する運用が有効。

### 4. 運用フロー (AI + 人の協調ループ)

* このループを回すことで、AI 伴走型開発でも **SPEC に準拠するリズム** を保つことを目指します。

1. 開発タスク発生 → 関連 SPEC セクションを明示
2. AI (ChatGPT) に対してプロンプトを投げ、初期コード生成
3. 人がレビュー (SPEC 準拠性／設計妥当性チェック)
4. Claude で設計観点レビュー or 整合性チェック
5. 必要あれば SPEC／CLAUDE.md を修正
6. ChatGPT に修正プロンプトを送り再出力 → 最終レビュー → マージ

### 5. 注意・制限事項

* AI はあくまで“補助ツール”であり、設計判断や要件解釈の最終責任は開発者にあることを忘れないでください。
* プロンプト過多／過重は逆に AI の出力を不安定にすることもあるため、適度な情報量に絞る工夫が必要です。
* 機密情報や認証キーなどはプロンプトに含めないよう注意してください (プロンプトが外部送信されるケースを想定)。
