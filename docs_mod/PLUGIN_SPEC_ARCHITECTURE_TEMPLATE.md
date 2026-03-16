# SPEC_ARCHITECTURE.md（テンプレート｜コード構造と責務）

> 各プラグインリポジトリの `docs/` 等にコピーし、`WP_PLUGIN_SPEC.md` §2〜§5 と整合する形で埋めてください。

---

## 1. ディレクトリ構成（プラグイン固有版）

> 共通仕様の雛形（`WP_PLUGIN_SPEC.md` §2.1）をベースに、実際のプラグイン構成を書き出してください。

```text
plugin-slug/
├─ plugin-slug.php
├─ uninstall.php
├─ includes/
│  ├─ ...
├─ src/
│  ├─ admin/
│  ├─ frontend/
│  ├─ gutenberg/
│  └─ ...
└─ ...
```

---

## 2. 主要モジュールと責務

### 2.1. PHP（`includes/` 配下）

- クラス名:
  - 役割:
  - 主な公開メソッド:
  - 利用する WordPress API（例: `register_rest_route`, `register_setting` 等）:

### 2.2. フロントエンド（`src/` 配下）

- エントリーポイント:
  - `src/admin/index.tsx`: 管理画面 UI のルート
  - `src/gutenberg/index.tsx`: ブロックエディター用
- コンポーネント体系（例）:
  - `components/`: Presentational Component
  - `hooks/`: ロジック・状態管理
  - `utils/`: 共通ユーティリティ

### 2.3. 共通ライブラリ・Composer パッケージ

- 利用する共通ライブラリ（例: `s2j-openai-lib`）:
- 本プラグインからの利用箇所／責務境界:

---

## 3. レイヤー構造と依存関係ルール

> 「どの層がどの層に依存して良いか」を決めておくと、AI にリファクタリングを頼むときも安全です。

- 例:
  - UI 層（React コンポーネント）は **ドメイン層の型と関数にのみ依存**し、インフラ層（API クライアント等）に直接依存しない。
  - PHP の REST コントローラは、ドメインサービスクラスを経由してのみ DB や外部 API にアクセスする。

---

## 4. React / WordPress 互換性戦略

> `WP_PLUGIN_SPEC.md` §3.4 の方針を、このプラグインでどう具体化するかを整理します。

- ビルド時の React バージョン:
- 実行時に利用する React（`wp.element` 利用の有無）:
- `tsconfig.json` の `jsx` 設定:
- `src/types/wordpress.d.ts` のカスタマイズ有無:

---

## 5. セキュリティ・パフォーマンス設計方針

- Nonce チェック・権限チェックをどの層で行うか:
- キャッシュ戦略（Transients API / オブジェクトキャッシュ等）の利用方針:
- パフォーマンス対策（クエリ最適化、`React.memo`, `useMemo` など）の基本ルール:

---

## 6. 補足（AI への指示例）

このファイルを AI に読ませた上で、例えば次のように依頼します。

```text
docs/SPEC_ARCHITECTURE.md のレイヤー構造と責務分割ルールに従って、
`includes/RestController.php` に新しい `/plugin-slug/v1/foo` エンドポイントを追加してください。
DB へのアクセスは必ずドメインサービス `FooService` 経由にしてください。
```

