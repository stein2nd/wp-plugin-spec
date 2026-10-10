# docs/archive (凍結スナップショット)

本フォルダーは、次の2種を置く。

1. **仕様リライトの旧正本** — 公開正本の一式を置き換えた場合の freeze
2. **完了した実装・改修イニシアチブの証跡** — `impl-<slug>/` / `mod-<slug>/` の三点セット

規則の正本は [../SPECS.md](../SPECS.md) §4.3〜§4.5と、製品向けひな型 [../DOCUMENTATION_GOVERNANCE_TEMPLATE.md](../DOCUMENTATION_GOVERNANCE_TEMPLATE.md) である。製品リポジトリではコピー先の `docs/governance/documentation_governance.md` を正とする。

## 命名 (要約)

| 種類 | フォルダー |
| --- | --- |
| 実装イニシアチブ | `impl-<slug>/` |
| 改修イニシアチブ | `mod-<slug>/` |
| 仕様リライトの旧正本 | `spec-<slug>/` または簡潔な英文名 |

各 `impl-*` / `mod-*` には `modification.md` / `status.md` / `test-results.md` を置く。

## 索引 (本リポジトリ)

| 日付 | フォルダー | 種別 | 一言 | 備考 |
| --- | --- | --- | --- | --- |
| 2026-08-17 | [adapter-and-pure-domain/](./adapter-and-pure-domain/) | 仕様リライト | ドメイン純関数・アダプタ方針への移行前の旧正本 | 英文名フォルダー (当時の命名) |

製品リポジトリでは、イニシアチブ完了のたびに行を足す。機械成果物 (カバレッジ HTML 等) はここには置かない。
