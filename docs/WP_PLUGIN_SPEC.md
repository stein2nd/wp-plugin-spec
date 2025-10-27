# WordPress Plugin Development Spec (共通仕様)

* 本ドキュメントは、本リポジトリ配下で開発する WordPress プラグインに共通する仕様を定義します。  
* 各プラグインごとの個別仕様は、各リポジトリ内の `SPEC.md` に記載します。

---

## 1. 準拠ドキュメント

* [WordPress コーディング規約ハンドブック](https://ja.wordpress.org/team/handbook/coding-standards/)
* [WordPress プラグイン開発ハンドブック](https://ja.wordpress.org/team/handbook/plugin-development/)

---

## 2. プロジェクト構成

* 本章では、「ファイル構造」を記載します。

### 2.1. フォルダー構成

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

## 3. 技術スタック・開発環境

* 本章では、「開発に必要な技術情報」を記載します。

* Node.js v18+
* npm v9+
* Vite + TypeScript + React + SCSS
* WordPress 6.x 系を対象
* ローカル開発は「Local by Flywheel」または同等の環境を利用すること

### 3.1. フロントエンド技術スタック

* **React v18.2**: 管理画面 UI の構築
* **TypeScript v5.9**: 型安全性の確保
* **SCSS**: スタイル管理とデザインシステム
* **Vite v7.1**: 高速ビルドとモジュールバンドリング

### 3.2. ビルド要件

* Vite + TypeScript + SCSS
  * `vite.config.ts` を用いて IIFE 形式でバンドルする
  * JavaScript は WordPress 同梱の jQuery を利用可能とする (外部 import 不要) (`jQuery(function($) { ... })`)
  * CSS も IIFE 出力し、エディター用・フロント用を区別すること
* 出力は `./dist`

### 3.3. `package.json` の `scripts`

* `npm run build:dev` → 開発用ビルド (minify 無効)
* `npm run build:production` → 本番用ビルド (minify 有効)
* `npm run dev` → 開発用ビルド (watch モード)
* `npm run lint` → ESLint + Stylelint によるコード品質チェック
* `npm run makepot` → 翻訳テンプレート生成

---

## 4. 国際化

* 本章では、「多言語対応」を記載します。

* テキストはすべて `__()` / `_e()` / `_x()` / `_n()` を適切に使用する (複数形対応を含む)。日付・数値フォーマットについては、地域別の表示形式での対応も考慮する。「RTL 言語」対応も考慮する。
* 翻訳ファイルは `languages/` に配置する。
* 翻訳テンプレート `.pot` は `wp i18n makepot` により生成する。
* Text Domain は plugin-slug に合わせる。

---

## 5. コード規約

* クラスベースで実装し、名前空間の衝突を避ける。
* クラス命名規則: `Vendor_Plugin_Function` 形式 (例: `S2J_SlugGenerater_REST`)。
* WordPress コーディング規約 (PHPCS, WPCS) に準拠する。
* PHP コードでの主要な機能はクラスにまとめ、`includes/` に配置する。

### 5.1. コード品質

* **TypeScript 厳密型チェック**: `strict: true` 設定での型安全性を確保する。
* **ESLint ルール準拠**: WordPress コーディング規約に準拠する。
* **コンポーネント分割**: 単一責任の原則にもとづいて設計する。
* **カスタムフック活用**: 「ロジックの再利用性」向上を考慮する。

### 5.2. パフォーマンス最適化

* **React.memo**: 不要な再レンダリングを防止する。
* **useCallback/useMemo**: 関数・オブジェクトをメモ化する。
* **遅延読み込み**: 必要時のみコンポーネントを読み込む。
* **バンドルサイズ最適化**: 不要な依存関係を排除する。

### 5.3. アクセシビリティ

* **ARIA 属性**: 適切なラベル、ロール、状態を設定する。
* **キーボード・ナビゲーション**: 全機能のキーボード操作対応を目指す。
* **スクリーン・リーダー**: 音声読み上げに対応する。
* **コントラスト比**: WCAG の2.1AA に準拠する。

### 5.4. 共通ライブラリを Composer 化

複数の WordPress プラグインで共通利用されるロジック (例: OpenAI 連携、翻訳、キャッシュ、ログ管理、等) を、独立した Composer パッケージとして管理することで、再利用性・保守性・更新容易性を高める。

#### **設計原則**

| 項目 | 指針 |
| --- | --- |
| **責務の分離** | 共通パッケージは「1つの明確な責務 (例: 翻訳 API)」のみに特化する。 |
| **軽量化** | 不要な依存や重複コードを避け、パッケージを最小構成に保つ。 |
| **依存管理** | 依存は `composer.json` に明示し、明確なバージョン指定を行う (例: `"openai-php/client": "^0.10"`)。 |
| **名前空間** | `Vendor\Project\Module` 構成 (例: `S2J\OpenAI`) でグローバル衝突を防ぐ。 |
| **ロード方法** | PSR-4オートロードを使用。`require_once` ベースではなく、`composer autoload` を推奨。 |
| **API キー管理** | API キーや設定値は「外部注入」する (例: `setApiKey()` や DI)。ライブラリ内部で保持しない。 |
| **WordPress 依存の排除** | 可能な限り `add_action`・`get_option` など WordPress 依存コードを含めず、**純粋な PHP ライブラリ**とする。 |
| **例外処理** | OpenAI や外部 API 呼び出し時は例外を throw し、呼び出し元プラグインが処理を制御できるようにする。 |
| **ライセンス整合性** | GPL 互換 (例: GPL v2以降/MIT/Apache v2.0) を遵守。 |
| **バージョニング** | `semver` (Semantic Versioning) に従い、破壊的変更はメジャーバージョンで管理。 |

#### **パッケージ例構成**

```
s2j-openai-lib/
├── composer.json
├┬─ src/
│├─ Client.php
│├─ Translator.php
│└─ Embedding.php
├┬─ tests/
│└─ TranslatorTest.php
└── README.md
```

#### **composer.json の例**

```json
{
  "name": "stein2nd/s2j-openai-lib",
  "description": "Reusable OpenAI integration library for S2J WordPress plugins.",
  "type": "library",
  "license": "GPL-2.0-or-later",
  "autoload": {
    "psr-4": {
      "S2J\\OpenAI\\": "src/"
    }
  },
  "require": {
    "openai-php/client": "^0.10"
  },
  "require-dev": {
    "phpunit/phpunit": "^10.0"
  },
  "minimum-stability": "stable"
}
```

#### **WordPress プラグイン側での取り込み方**

| 方法 | 用途 | 備考 |
| --- | --- | --- |
| Composer install (開発・CI 環境) | 開発・テスト・自動デプロイ時に依存を解決 | `.gitignore` に `vendor/` を含め、配布時に `vendor/` 同梱可 |
| vendor 同梱 | WordPress.org 公開用 | 審査基準に従い、不要ファイルを削除して最小構成に |
| Git submodule | Composer 非対応環境 | 同期と管理に注意が必要 |

#### **将来的な拡張指針**

* 共有ライブラリ群を monorepo (例: `stein2nd/wp-libs/`) に集約する。
* 自動テスト (GitHub Actions) を用い、PHP v8.x、WP v6.x での動作確認を継続。
* 共通パッケージは WordPress プラグインと独立してリリースバージョン管理する (例: `s2j-openai-lib v1.2.0`)。

---

## 6. スタイル規約

* 余白・間隔 (padding, margin, blockGap 等)、テキストサイズ を rem で定義すること
* WordPress コアの慣例に準拠し、`rem` を基本単位とする。
* `px` は微調整や境界条件に限って利用する。
* `em` はコンポーネント内部の相対サイズ調整に限定する。

### 6.1. W3C 仕様に準拠した主要 CSS プロパティのうち、em / rem 単位を受け付けるもの

以下は、ブラウザ差異を排除し、**CSS Level の3/4の安定仕様 (勧告・勧告候補の段階)** を基準にまとめています。

#### 6.1.1. 🧭 em / rem が利用可能な主要 CSS プロパティ一覧 (W3C 準拠)

| カテゴリー | プロパティ | 説明 | 備考 |
| --- | --- | --- | --- |
| **フォント関連** | `font-size` | フォントサイズを親またはルートに対して相対指定が可能 | `em` / `rem` 両対応 |
| | `letter-spacing` | 文字間隔を相対化 | 相対スケーリングに適する |
| | `word-spacing` | 単語間隔を相対化 | |
| | `text-indent` | 段落インデント | 相対指定で読みやすさを維持 |
| | `line-height` | 行の高さ (単位省略時はフォントサイズ倍率) | 数値、em/rem 両対応 |
| | `text-shadow` | 文字の影 (オフセット・ぼかし距離) | 影の距離を相対指定可 |
| **ボックスモデル** | `margin` / `margin-*` | 外側余白を相対指定 | すべての方向で em/rem 可 |
| | `padding` / `padding-*` | 内側余白を相対指定 | すべての方向で em/rem 可 |
| | `border-width` / `border-*` | 枠線の太さを相対指定 | |
| | `border-radius` | 角丸半径を相対指定 | |
| | `outline-width` | アウトライン線の太さを相対指定 | |
| **サイズ関連** | `width` / `height` | 要素サイズを相対化 | 文字スケール対応 UI に有用 |
| | `min-width` / `max-width` | 最小・最大幅を相対化 | |
| | `min-height` / `max-height` | 最小・最大高さを相対化 | |
| **レイアウト位置** | `top` / `bottom` / `left` / `right` / `inset`  | 絶対/固定配置の位置指定 | 相対移動可 |
| | `translate` / `transform: translate(...)` | 位置変換 | em/rem 可 (ブラウザ対応済) |
| | `gap` / `row-gap` / `column-gap` | Flex/グリッド の間隔 | em/rem 可 |
| | `grid-template-rows` / `grid-template-columns` | セルサイズを相対指定 | |
| | `flex-basis` | Flex 要素の初期サイズ | `%` または em/rem 併用可 |
| **装飾・効果** | `box-shadow` | 影の距離・ぼかしを相対化 | em/rem 指定可能 |
| | `filter: drop-shadow(...)` | 同上 (影距離) | 一部ブラウザ制限あり |
| | `outline-offset` | アウトラインのオフセット距離 | 相対指定可 |
| **背景・画像** | `background-position` | 背景位置 (相対指定が可能だが非推奨) | `em/rem` 可 (% 推奨) |
| | `background-size` | 背景サイズ (相対指定が可能だが非推奨) | `em/rem` 可 |
| **テーブル関連** | `border-spacing` | セル間余白 | em/rem 可 |
| **その他** | `clip-path: inset()` | 切り抜き領域を相対指定が可能 | CSS Shapes Level: 1 |
| | `mask-position`, `mask-size` | マスク位置・サイズ | em/rem 可 (CSS Masking Level: 1) |

#### 6.1.2. 🧩 単位別の注意点

| 単位 | 基準 | 主な用途 | 注意点 |
| --- | --- | --- | --- |
| `em` | 親要素の `font-size` | コンポーネント単位のスケーリング | ネストでサイズが累積変化する |
| `rem` | `html` 要素の `font-size` | ページ全体の一貫スケーリング | グローバルに統一可能 |
| `%` | コンテナの寸法 | レイアウト基準での相対指定 | フォントサイズには使えない |

#### 6.1.3. 📘 仕様参照 (W3C)

* [CSS Values and Units Module Level 3](https://www.w3.org/TR/css-values-3/#lengths)
* [CSS Box Model Level 3](https://www.w3.org/TR/css-box-3/)
* [CSS Fonts Level 4](https://www.w3.org/TR/css-fonts-4/)
* [CSS Backgrounds and Borders Level 3](https://www.w3.org/TR/css-backgrounds-3/)
* [CSS Transforms Level 2](https://www.w3.org/TR/css-transforms-2/)
* [CSS Grid Layout Level 2](https://www.w3.org/TR/css-grid-2/)
* [CSS Flexible Box Layout Module Level 1](https://www.w3.org/TR/css-flexbox-1/)

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
* 外部 API (例: DeepL) を利用する場合は、`wp_remote_post` / `wp_remote_get` を利用し、エラーハンドリングを実装する

---

## 9. Gutenberg ブロック仕様

* [ブロックエディターハンドブック](https://ja.wordpress.org/team/handbook/block-editor/) に準拠する
* ブロックは `src/` に実装し、`register_block_type` で `dist/` 出力物を読み込む
* `edit` 側は React Hooks を利用
* 翻訳文字列は `@wordpress/i18n` を利用 (`__()`, `_x()`)
* `save` は必要に応じて実装するが、REST 経由の処理が多いため `null` 戻りが基本
* Gutenberg 用ブロックは `block.json` を正とし、編集画面・保存処理の双方で仕様を満たすこと  

## 10. Classic エディター対応 (必要な場合)

* `assets/classic.js` または `src/classic.ts` に記述
* Classic エディター専用 UI は `add_meta_box` で提供する
* Classic Editor 用ショートコードは **補助互換レイヤー** として実装し、プライマリ仕様はブロックに置く。  

---

## 11. バージョン管理・配布

* `dist/` は Git 管理対象外とする
* GitHub リポジトリは private を基本とする (OSS 化時は public に切り替え)
* リリースは GitHub Release + Zip Export で配布可能とする
* バージョン番号は Semantic Versioning (SemVer) に準拠

---

## 12. Backlog

* 本章では、「今後の予定」を記載します。

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
  * AI に対して「WP_PLUGIN_SPEC.md および SPEC.md および CLAUDE.md に従って実装してください」という旨を常にプロンプトに含めてください。

3. **Prompt 運用ルールを定義・共有する**

  * 各機能あるいはモジュール単位で、標準プロンプト定型テンプレート (ひな型) をチームで決めておいてください。
  * Prompt に「参照すべき SPEC のセクション」「設計規範を指定するファイル名 (例: CLAUDE.md)」「禁止事項・注意事項」などを明示してください。
   * 例: 「WP_PLUGIN_SPEC.md Appendix B § B.2に従って、このブロックの保存処理を TypeScript で実装してください。」

4. **AI 出力の自律チェック/レビューを必ず実施**

  * AI が生成したコード／ドキュメントは必ず人がレビューし、SPEC 準拠かをチェックしてください。
  * 特に WordPress API の利用方法 (`wp_nonce_field`, `sanitize_text_field` など) は人間が精査してください。
  * レビュー時には以下観点を最低限確認してください。

    * a) 入出力仕様が合っているか
    * b) 例外処理やエッジケース対応が抜けていないか
    * c) 命名規則・責務分割・モジュール境界が設計方針 (CLAUDE.md) に準じているか
    * d) セキュリティ／パフォーマンス上の懸念点がないか

5. **AI 生成と手動修正の境界を設ける**

  * 単純な CRUD や定型的な処理は AI に生成させ、複雑な制御や設計判断のある箇所は手動実装または人による指示付き生成とします。
  * AI 出力後、必ず人が「なぜその設計になったか」をコメントで残す (AI 理由説明コメント含む)。

6. **継続的な Prompt チューニングと振り返り**

  * AI に出力させたコード品質を定期的に振り返り、プロンプト改善案をチームで共有してください。
  * Prompt による逸脱や誤生成が続く場合、SPEC や CLAUDE.md の記述を再精査し、あいまい性を排除してください。

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
5. 必要あれば SPEC/CLAUDE.md を修正
6. ChatGPT に修正プロンプトを送り再出力 → 最終レビュー → マージ

### 5. 注意・制限事項

* AI はあくまで“補助ツール”であり、設計判断や要件解釈の最終責任は開発者にあることを忘れないでください。
* プロンプト過多／過重は逆に AI の出力を不安定にすることもあるため、適度な情報量に絞る工夫が必要です。
* 機密情報や認証キーなどはプロンプトに含めないよう注意してください (プロンプトが外部送信されるケースを想定)。

---

## Appendix B: Git 運用ルール

* Git 管理下に含めるべきファイル・含めないファイルを明確にし、環境依存やビルド成果物を排除することで、再現性の高い開発環境を維持します。
* 新規の依存管理ツール導入時は `.gitignore` を更新し、Appendix A に追記してください。

### 1. 運用ルール

* `.gitignore` は **リポジトリルートに設置**し、全員が共通利用します。

### 2. すでに管理対象になっているファイルを解除する手順

1. ターミナルでリポジトリルートに移動
2. 以下を実行してキャッシュから除外 (Git の管理対象から外す)

   ```zsh
   git rm --cached -r path/to/除外したいディレクトリ_or_ファイル
   ```
3. `.gitignore` を更新 (該当パターンを追加)
4. コミットしてプッシュ

   ```zsh
   git commit -m "Remove unwanted files from repo and update .gitignore"
   git push
   ```

### 3. ブランチ戦略とコミット規約

* **ブランチ戦略**

  * `main` (または `master`): 常に安定／リリース可能な状態
  * `feature/xxx`: 新機能の開発用ブランチ
  * `fix/xxx`: バグ修正用ブランチ
  * リリース時には `release/x.y.z` ブランチを切り、バージョン管理を明確化する。
  * Pull Request → レビュー + CI 通過後マージ

* **コミットメッセージ規約**

  * コミットメッセージは英語を基本とするが、日本語併記も許容。
  * 接頭辞の推奨例:
    * `feat:` 新機能追加
    * `fix:` バグ修正
    * `docs:` ドキュメント更新
    * `style:` フォーマット調整 (機能変更なし)
    * `refactor:` リファクタリング
    * `test:` テスト関連
    * `chore:` ビルド/CI/依存関係の更新

* **PR/レビュー運用**

  * 少ないファイル差分で提出
  * レビュー承認前に CI が通ること
  * (オプション) マージ前に rebase/squash を行う

---

### 5. CI/テストとの連携ルール

* `.github/workflows` などの CI 設定ファイルは Git 管理対象
* テストスイートが通ることをマージ条件とする
* ビルドキャッシュや生成物は Git 管理しない

* Issue と Pull Request は必ず紐付ける (`close #123` など)。
* Pull Request には、対応する SPEC セクションを記載し、レビュー効率を高める。
* CI/CD (例: GitHub Actions) を利用して lint/test を自動化する。

---

## FAQ: 削除ファイルの扱い

### Q1. ローカルで削除したが、まだコミットしていない場合に「Hunk を戻す」を押すと ?

* 削除が取り消され、ファイルは直前の Git 管理下の内容で復活する。

### Q2. ローカルで削除をコミット済みの場合に「Hunk を戻す」を押すと ?

* すでに履歴に削除が残っているため、そのままでは復活しない。復元するには `git restore` や「履歴から復元」を実行する必要がある。

### Q3. リモート (GitHub) 側で削除されたが、ローカルにファイルが残っている場合は ?

* **まだ pull していない場合**: ローカルの Git クライアントは削除を認識していないため、削除差分そのものが表示されない。この場合「Hunk を戻す」対象にならない。
* **pull 済みで削除差分が反映された場合**: ローカルの Git クライアント上で「削除されたファイル」と表示される。ここで「Hunk を戻す」を押すと、削除が取り消されファイルが復活する。
* **pull 済みでローカルに未コミット変更がある場合**: 「リモート削除 vs ローカル変更」の競合になる。この場合「Hunk を戻す」を押すと、削除が取り消され、ローカル編集を残したままファイルが復活する。
