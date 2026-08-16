# wp-plugin-spec - CHANGELOG

## unreleased

## 2.0.2 - 2026-08-17

* ドメインを純関数、I/O をアダプタとする設計方針を共通仕様に反映。
* 公開正本のファイル名を `SPECS.md` / `CICD.md` / `*_TEMPLATE.md` に整理。
* 旧正本を `docs/archive/adapter-and-pure-domain/` に freeze。

## 2.0.1 - 2026-08-13

* `@s2j/docs-linter` を v1.0.22に更新
* npm v12向けに `.npmrc` を追加 (`allow-git=all` / `legacy-peer-deps=true`)
* `@s2j/docs-linter` の install スクリプトを `allowScripts` で許可

## 2.0.0 - 2026-06-11

### Breaking

* ライセンスを GPL-2.0-or-later から GPL-3.0-or-later に変更

## 1.0.1 - 2026-06-11

* `@s2j/docs-linter` を v1.0.18に更新
* GitHub Actions によるドキュメント lint ワークフロー (`docs-lint.yml`) を追加
* VS Code の textlint 設定を workspace 変数ベースに更新
