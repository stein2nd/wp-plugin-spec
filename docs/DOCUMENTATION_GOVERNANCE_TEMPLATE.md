<!--
目的：「ドキュメント整合・archive 運用」の明文化 (WordPress プラグイン / Composer ライブラリ共通)
-->

# wp-plugin-spec - ドキュメンテーション・ガバナンス (ひな型)

* 各プロダクトリポジトリの `docs/governance/documentation_governance.md` にコピーして利用することを想定する。
* コピー後、1行目を `# <product-slug> - ドキュメンテーション・ガバナンス` に変更する。
* WordPress プラグインと Composer ライブラリの両方で同じ型を使う。ライブラリでは「画面文言」「WP アダプタ」節を削るか「該当なし」と書く。

* **目的**:
  * README と `docs/` の整合、用語、lint、仕様ライフサイクル、イニシアチブ証跡 (archive) を一ヵ所に置く。
* **AI 的メリット**:
  * 「正本はどれか」「完了したら何を freeze するか」を毎回説明しなくてよくなる。

共通の要約は、[SPECS.md](./SPECS.md) §4です。本ファイルは、製品ごとの Source of Truth 表と運用の細部を書きます。

## 1. Source of Truth

| 対象 | 正本 (例。製品に合わせて書き換える) |
| --- | --- |
| ドメイン規則 / 計算 | Composer: `docs/core/`。プラグイン単体: `docs/` 内の該当 SPEC |
| 型・データ契約 | `docs/contracts/` または `SPEC_DATA_DICTIONARY.md` |
| 公開 API | Composer: `docs/interfaces/`。プラグイン: REST / フック仕様 |
| 画面、永続化、i18n (プラグイン) | プラグイン側 `docs/` (アダプタ仕様) |
| 最短手順・インストール | ルート `README.md` |
| 統合の見取り図 | `docs/specs.md` または `service_spec.md` / `plugin_spec.md` (要約。細部の正本ではない) |

矛盾時は **規則・契約の正本** を直し、README、要約、usage を追随させます。

## 2. 用語

* コード名・キー名は、データ辞書 / contracts に従う。
* WordPress プラグイン: 画面の表示文言は、「適切なメッセージ文を表示する」と書き、国際化関数の経由を前提とする (SPECS.md §4.2.1)。
* Composer ライブラリ: 表示文言を返さず、コードや構造化データだけを返す。プラグイン側のラベルとライブラリの識別子を混同して書かない。

## 3. Lint

* `@s2j/docs-linter` を使う場合は SoT とし、ローカルと CI で同じ `npm run lint:docs` を使う。
* 対象は `README.md` と仕様 Markdown である (製品の `package.json` に合わせる)。

## 4. 分割ルール

* 新規仕様は、製品の `docs/specs.md` (索引) のレイヤーに分類する。
* 必要になるまで、他製品にある層 (OpenAPI / SRE 等) を増やさない。

## 5. 改訂フロー (`docs_mod` → `docs`)

* 確定仕様の正本は `docs/` である。
* 大きな改訂案は `docs_mod/` で起草し、レビュー・合意のあと `docs/` に反映する。
* 依存リポジトリからのリンクは、可能な限り `docs/` を指すように保つ。
* 小さな typo は `docs/` を直接直してよい。

## 6. イニシアチブ証跡 (archive)

実装・改修の区切りごとに、人が読める合格証跡を残す。PHPUnit の HTML / XML など機械成果物とは別である (カバレッジは `/coverage/` 等。gitignore)。

### 6.1. 命名

| 種類 | フォルダー | いつ使うか |
| --- | --- | --- |
| 実装イニシアチブ | `docs/archive/impl-<slug>/` | まだない能力を初めて入れる |
| 改修イニシアチブ | `docs/archive/mod-<slug>/` | すでに `docs/` にある仕様・振る舞いを変える |
| 仕様リライトの旧正本 | `docs/archive/spec-<slug>/` または簡潔な英文名 | 公開正本の一式を置き換えた場合の旧版 |

`<slug>` は短い kebab-case。SemVer はフォルダー名に入れない。

### 6.2. 三点セット

作業中は `docs_mod/`、完了時に archive にフリーズする。

| ファイル | 書くこと | 書かないこと |
| --- | --- | --- |
| `modification.md` | 目的、スコープ内外、タスク表、完了定義 | 長い仕様本文 |
| `status.md` | 進捗サマリー、完了条件、残ギャップ | 生のカバレッジ HTML |
| `test-results.md` | 仕様条件 ID ごとの PASS / WARN / FAIL | 生ログの丸貼り |

### 6.3. ライフサイクル

1. **開始** … `docs_mod/` に三点セット (必要なら仕様ドラフトも)
2. **作業** … 合意仕様は都度 `docs/` に。証跡は `docs_mod/` で更新
3. **フリーズ** … `docs/` 最新、`test-results.md` に FAIL なし (WARN は理由付きのみ可)、CHANGELOG unreleased に一行 → `docs/archive/impl|mod-<slug>/` にコピーして固定
4. **フリーズ後** … archive は原則変更しない。続きは新しいイニシアチブを切る
5. **片付け** … `docs_mod/` の三点は削除してよい (ディレクトリと `docs_mod/README.md` は残す)

### 6.4. いつ切るか

* コードまたは契約が動くイニシアチブでは、三点セットを切る。
* docs だけの整備は archive 任意。
* 初回実装は、縦に切ってよい (例: `impl-skeleton` → `impl-core` → `impl-ui`)。

### 6.5. 全体 status との関係

* `docs/status.md` (または同等) は、製品全体の「いま」である。
* `docs/archive/.../status.md` は、そのイニシアチブ完了時点の凍結である。
* 全体 status に、進行中の `docs_mod/` と直近 archive へのリンクを短く置いてよい。進捗表の二重管理はしない。

索引は [archive/README.md](./archive/README.md) である (各リポジトリで作成)。

## 7. `docs/archive/README.md` に置くもの

* 本ガバナンスへのリンク (規則の正本はこちら)
* 命名の一行要約 (`impl-` / `mod-` / 仕様リライト)
* 完了イニシアチブの索引表 (日付・フォルダー・種別・一言)

機械成果物は、archive に置かない。

## 8. `docs_mod/README.md` に置くもの (推奨)

* 確定正本は `docs/` であること
* 起草中の仕様ドラフトと、進行中イニシアチブ三点の置き場であること
* 完了後は archive に freeze し、三点は削除してよいこと
* 詳細へのリンク (本ファイルと `docs/archive/README.md`)
