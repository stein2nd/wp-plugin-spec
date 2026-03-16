# SPEC_AI_COLLAB.md（テンプレート｜AI 伴走開発ルール）

> `WP_PLUGIN_SPEC.md` Appendix A を、各プラグイン用にカスタマイズするためのテンプレートです。

---

## 1. このプラグインでの基本方針

- SPEC の正典:
  - 共通: `WP_PLUGIN_SPEC.md`
  - プラグイン固有:
    - `docs/SPEC_OVERVIEW.md`
    - `docs/SPEC_ARCHITECTURE.md`
    - `docs/SPEC_UI_AND_FLOWS.md` / `docs/SPEC_UI_API_DATA.md`
    - `docs/SPEC_API_AND_INTEGRATION.md`
    - `docs/SPEC_DATA_DICTIONARY.md`
- 禁止事項（AI に対して）:
  - セキュリティチェック（Nonce / capability / サニタイズ）を省略する提案は禁止
  - WordPress コーディング規約に明確に反するパターンは採用しない

---

## 2. 標準プロンプト例

### 2.1. 実装タスク用

```text
以下の仕様と規約に従ってコードを生成してください。

- WP_PLUGIN_SPEC.md
- docs/SPEC_OVERVIEW.md
- docs/SPEC_ARCHITECTURE.md
- docs/SPEC_UI_API_DATA.md の「1. 画面仕様（UI）とフロー / 画面 ID: XXX」
- docs/SPEC_DATA_DICTIONARY.md の該当セクション
- docs/SPEC_AI_COLLAB.md

前提:
- WordPress コーディング規約に準拠してください。
- Nonce チェックと権限チェックを必ず実装してください。
```

### 2.2. レビュー／リファクタリング用

```text
次のファイルについて、仕様との不整合や責務違反がないかレビューし、
必要であれば修正案を提示してください。

- 対象ファイル:
  - includes/RestController.php

参照仕様:
- WP_PLUGIN_SPEC.md
- docs/SPEC_ARCHITECTURE.md
- docs/SPEC_API_AND_INTEGRATION.md
- docs/SPEC_DATA_DICTIONARY.md
```

---

## 3. 運用ルール

- 新しい機能追加時:
  - 先に SPEC（上記ファイル群）の該当箇所を更新 → そのうえで実装を AI に依頼する。
- バグ修正時:
  - SPEC と実装どちらが正しいかを検討し、必要に応じて SPEC を更新したうえで修正を行う。

---

## 4. 振り返りと改善

- 定期的に（例: リリースごとに）、AI 生成コードの品質をチームで振り返り、
  - どの SPEC が曖昧だったか
  - どのプロンプトが有効だったか
  - どのルールが抜けていたか
  を洗い出して、この `SPEC_AI_COLLAB.md` を更新する。

