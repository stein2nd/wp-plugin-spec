<!-- 
目的：「コード構造と責務」の明文化
 -->

# SPEC_ARCHITECTURE.md (コード構造と責務)

> 各プラグインリポジトリ直下の `docs/` フォルダ等にコピーして利用することを想定しています。
> ファイル名の一例: `docs/SPEC_ARCHITECTURE.md`

* **目的**:
  * `includes/`, `src/`, Gutenberg ブロック、REST クラスなどの責務分担を整理する。
* **内容例**:
  * 主要クラス図・ディレクトリ構造
  * 「どのレイヤーでどの WordPress API を使うか」の方針
  * 共通 Composer ライブラリ (Appendix: 「共通ライブラリを Composer 化」) の利用方針
* **AI 的メリット**:
  * 「この処理はどの層に置くべき ?」といった相談を AI に投げたとき、迷いなく提案してもらえる。

---

## 1. ディレクトリ構成 (プラグイン固有版)

各プラグインは、以下のディレクトリ構成を基本とします。これをベースに、実際のプラグイン構成を書き出してください。

```text
plugin-name/  # プラグインフォルダー
├─ `package.json` # ビルド設定
├─ `readme.md`
├─ `LICENSE`
├─ `vite.config.ts`
├─ `tsconfig.json`
├── `eslint.config.js`  # ESLint 設定
├┬─ docs/  # 開発ドキュメント
│└─ `SPEC.md` # プラグイン固有仕様
├─ plugin-name.php # プラグイン本体
├─ `uninstall.php` # プラグイン削除時の処理
├┬─ languages/ # 翻訳ファイル
│├─ `plugin-name.pot`
│├─ `plugin-name-[ロケール名].po`
│└─ `plugin-name-[ロケール名].mo`  # WordPress 表示用バイナリ
├┬─ includes/ # PHPクラス群 (REST, Settings, Admin UI)
│├─ `SettingsPage.php`  # WordPress 管理画面の HTML 構造・メニュー登録、設定サニタイゼーション
│├─ `RestController.php`  # REST API エンドポイント定義・データ処理、権限チェック
│└─ `BlockName.php`  # Gutenberg ブロック登録・レンダリング、ショートコード登録
├─ src/ # TypeScript/React/SCSS ソース
│├┬─ admin/  # 設定画面用
││├─ `index.tsx`  # 管理画面メイン・エントリーポイント
││├┬─ components/
│││└─ `SettingsForm.tsx`  # 設定保存フォーム
││├┬─ data/
│││└─ `constants.ts`  # 定数定義
││└┬─ utils/  # ユーティリティ
││　└─ `errorHandler.ts`  # エラー・ハンドリング
│├┬─ frontend/  # フロントエンド表示
││└─ `block-name.tsx`  # ブロック・コンポーネント
│├┬─ gutenberg/  # Gutenberg ブロック用
││├─ `index.tsx`
││└┬─ block-name/  # ブロック編集
││　├─ `index.tsx`  # コンポーネント
││　└─ `block.json`  # ブロック定義
│├┬─ styles/  # プラグイン用のスタイル定義
││├─ `admin.scss`  # 設定画面用
││├─ `gutenberg.scss`  # Gutenberg ブロック用
││├─ `frontend.scss`  # フロントエンド表示用
││└─ `variables.scss`  # SCSS 変数定義
│└┬─ types/  # プラグイン用のグローバル型定義
│　├─ `index.ts`
│　├─ `wordpress.d.ts`  # WordPress
│　└─ `dom.d.ts`  # DOM
└┬─ dist/ # Vite ビルド成果物 (Git管理外)
　├┬─ blocks/
　│└┬─ block-name/
　│　└─ `block.json`  # ブロック定義
　├── css/  # プラグイン用のスタイル定義
　└── js/  # プラグイン用の Gutenberg ブロック、設定画面
```

* プラグインフォルダー名、プラグイン本体のファイル名、テキストドメイン名は、一致する必要があります。
* その名称に利用できる文字種については下記の範囲になり、スペースは除去する必要があります。
  * アンダースコアの代わりに、ダッシュを使用
  * 小文字

---

## 2. コード規約

* クラスベースで実装し、名前空間の衝突を避ける。
* クラス命名規則:
  * `Vendor_Plugin_Function` 形式 (例: `S2J_SlugGenerater_REST`)。
* WordPress コーディング規約 (PHPCS, WPCS) に準拠する。
* PHP コードでの主要な機能はクラスにまとめ、`includes/` に配置する。

### 2.1. コード品質

* **TypeScript 厳密型チェック**:
  * `strict: true` 設定での型安全性を確保する。
* **ESLint ルール準拠**:
  * WordPress コーディング規約に準拠する。
* **コンポーネント分割**:
  * 単一責任の原則にもとづいて設計する。
* **カスタムフック活用**:
  * 「ロジックの再利用性」向上を考慮する。

### 2.2. パフォーマンス最適化

* **React.memo**:
  * 不要な再レンダリングを防止する。
* **useCallback/useMemo**:
  * 関数・オブジェクトをメモ化する。
* **遅延読み込み**:
  * 必要時のみコンポーネントを読み込む。
* **バンドルサイズ最適化**:
  * 不要な依存関係を排除する。

### 2.3. 共通ライブラリを Composer 化

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

#### **`composer.json` の例**

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
| Composer install (開発および CI 環境) | 開発・テスト・自動デプロイ時に依存を解決 | `.gitignore` に `vendor/` を含め、配布時に `vendor/` 同梱可 |
| vendor 同梱 | WordPress.org 公開用 | 審査基準に従い、不要ファイルを削除して最小構成に |
| Git submodule | Composer 非対応環境 | 同期と管理に注意が必要 |

#### **将来的な拡張指針**

* 共有ライブラリ群を monorepo (例: `stein2nd/wp-libs/`) に集約する。
* 自動テスト (GitHub Actions) を用い、PHP v8.x、WP v6.x での動作確認を継続。
* 共通パッケージは WordPress プラグインと独立してリリースバージョン管理する (例: `s2j-openai-lib v1.2.0`)。

---

## 3. 主要モジュールと責務

### 3.1. PHP (`includes/` 配下)

* クラス名:
  * 役割
  * 主な公開メソッド
  * 利用する WordPress API (例: `register_rest_route`、`register_setting` 等)

### 3.2. フロントエンド (`src/` 配下)

* エントリーポイント:
  * `src/admin/index.tsx` - 管理画面 UI のルート
  * `src/gutenberg/index.tsx` - ブロックエディター用
* コンポーネント体系 (例):
  * `components/` - Presentational Component
  * `hooks/` - ロジック・状態管理
  * `utils/` - 共通ユーティリティ

### 3.3. 共通ライブラリ、Composer パッケージ

* 利用する共通ライブラリ (例: `s2j-openai-lib`):
* 本プラグインからの利用箇所/責務境界:

---

## 4. レイヤー構造と依存関係ルール

> 「どの層がどの層に依存して良いか」を決めておくと、AI にリファクタリングを頼むときも安全です。

* 例:
  * UI 層 (React コンポーネント) は **ドメイン層の型と関数にのみ依存** し、インフラ層 (API クライアント等) に直接依存しない。
  * PHP の REST コントローラは、ドメインサービスクラスを経由してのみ DB や外部 API にアクセスする。

---

## 5. WordPress 環境での React 互換性戦略

各プラグインでどう具体化するかを整理します。

* ビルド時の React バージョン:
* 実行時に利用する React (`wp.element` 利用の有無):
* `tsconfig.json` の `jsx` 設定:
* `src/types/wordpress.d.ts` のカスタマイズ有無:

### 背景

WordPress プラグイン開発において、React を使用する場合、以下の問題が発生する可能性があります。

1. **ビルド時と実行時の React バージョン不一致**:
  * プラグインのビルド時に使用された React のバージョンと、WordPress 環境で実行時に使用される React のバージョンが異なる場合、`React エラー #31` などの互換性エラーが発生する可能性があります。
2. **WordPress が提供する React のバージョン**:
  * WordPress は Gutenberg エディター用に React v18を提供していますが、プラグイン開発者はより新しいバージョンの React (例: React v19) を使用したい場合があります。

### 解決策

WordPress 環境での互換性を確保するため、以下の対応を推奨します。

#### 1. JSX 変換設定

`tsconfig.json` の `jsx` オプションを `"react"` に設定し、JSX を `React.createElement` に変換します。

```json
{
  "compilerOptions": {
    "jsx": "react"
  }
}
```

**理由**: JSX を `React.createElement` に変換することで、実行時に WordPress が提供する React を使用できます。

#### 2. WordPress の React を使用する設定

実行時に WordPress が提供する React を使用するため、`wp.element` から `React` オブジェクトを構築し、グローバル変数として設定します。

```typescript
// WordPress が提供する React を使用するため、グローバル変数として設定
const win = window as any;
if (!win.React) {
  const wpElement = win.wp?.element;
  if (wpElement) {
    // wp.element から createElement を取得して React オブジェクトを構築
    win.React = {
      createElement: wpElement.createElement || wpElement,
      Fragment: wpElement.Fragment,
      Component: wpElement.Component,
    };
  }
}
// React をグローバルスコープで使用可能にする
var React = win.React;
```

**理由**: ビルド時に使用された React と実行時に使用される React のバージョン不一致を回避できます。

#### 3. `@wordpress/element` の render 関数を使用

WordPress が提供する React v18を使用するため、`@wordpress/element` の `render` 関数を使用します。

```typescript
import { render } from '@wordpress/element';

function getRenderFunction(container: HTMLElement) {
  return {
    render: (element: React.ReactElement) => {
      // @wordpress/element の render 関数を使用
      // これは WordPress が提供する React v18 を使用しているため、互換性の問題がありません
      render(element, container);
    }
  };
}
```

**理由**: `@wordpress/element` の `render` 関数は、WordPress が提供する React v18を使用しているため、互換性の問題がありません。

#### 4. 型定義の調整

TypeScript の型定義を調整し、WordPress の React と互換性を持たせます。

```typescript
// src/types/wordpress.d.ts
import * as ReactTypes from 'react';

declare global {
  var React: typeof ReactTypes;
  
  namespace React {
    type ReactElement = ReactTypes.ReactElement;
    type ReactNode = ReactTypes.ReactNode;
    // WordPress の React v18 に合わせて FC の型を調整
    type FC<P = {}> = (props: P) => ReactTypes.ReactElement | null;
    type FunctionComponent<P = {}> = FC<P>;
    const createElement: typeof ReactTypes.createElement;
    const Fragment: typeof ReactTypes.Fragment;
    const Component: typeof ReactTypes.Component;
  }
}
```

**理由**: TypeScript の型エラーを回避し、WordPress の React と互換性を持たせます。

### 実装例

以下は、管理画面で React コンポーネントをレンダリングする実装例です。

```typescript
import { render } from '@wordpress/element';
import { SettingsForm } from './components/SettingsForm';

// WordPress が提供する React を使用するため、グローバル変数として設定
const win = window as any;
if (!win.React) {
  const wpElement = win.wp?.element;
  if (wpElement) {
    win.React = {
      createElement: wpElement.createElement || wpElement,
      Fragment: wpElement.Fragment,
      Component: wpElement.Component,
    };
  }
}
var React = win.React;

// レンダリング関数
function getRenderFunction(container: HTMLElement) {
  return {
    render: (element: React.ReactElement) => {
      render(element, container);
    }
  };
}

// コンポーネントのレンダリング
const container = document.getElementById('my-container');
if (container) {
  const root = getRenderFunction(container);
  root.render(
    React.createElement(SettingsForm, {
      settings: mySettings,
      onSave: handleSave
    })
  );
}
```

### 注意事項

1. **ビルド時と実行時の React バージョン確認**:
  * 同様の問題が発生した場合は、ビルド時に使用された React と実行時に使用される React のバージョンが一致しているか確認してください。
2. **`@wordpress/element` の使用**:
  * WordPress 環境では、`@wordpress/element` を使用することで互換性を保つことができます。
3. **型定義の調整**:
  * TypeScript を使用している場合、型定義を適切に調整する必要があります。
4. **JSX の変換**:
  * JSX を `React.createElement` に変換することで、実行時に WordPress が提供する React を使用できます。

### 推奨事項

* **開発時**:
  * 最新の React バージョンを使用して開発し、型安全性と最新機能を活用します。
* **実行時**:
  * WordPress が提供する React を使用し、互換性を確保します。
* **ビルド設定**:
  * `tsconfig.json` の `jsx` オプションを `"react"` に設定し、JSX を `React.createElement` に変換します。
* **レンダリング**:
  * `@wordpress/element` の `render` 関数を使用して、コンポーネントをレンダリングします。

### 参考実装

この対応方法は、[S2J Alliance Manager](https://github.com/stein2nd/s2j-alliance-manager) プラグインで実装され、React v19.2へのアップグレード後も WordPress 環境で正常に動作することを確認しています。

---

## 6. セキュリティ、パフォーマンス設計方針

* Nonce チェック・権限チェックをどの層で行うか:
* キャッシュ戦略 (Transients API / オブジェクトキャッシュ等) の利用方針:
* パフォーマンス対策 (クエリー最適化、`React.memo`, `useMemo` など) の基本ルール:

---

## 7. 補足 (AI への指示例)

このファイルを AI に読ませたうえで、たとえば次のように依頼します。

```text
`docs/SPEC_ARCHITECTURE.md` のレイヤー構造と責務分割ルールに従って、`includes/RestController.php` に新しい `/plugin-slug/v1/foo` エンドポイントを追加してください。
DB へのアクセスは必ずドメインサービス `FooService` 経由にしてください。
```
