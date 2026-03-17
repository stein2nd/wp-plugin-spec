# WordPress Plugin Development Spec (共通仕様)

* 本ドキュメントは、本リポジトリ配下で開発する WordPress プラグインに共通する仕様を定義します。  
* 各プラグインごとの個別仕様は、各リポジトリ内の `SPEC.md` に記載します。

---

## 1. 準拠ドキュメント

* [WordPress コーディング規約ハンドブック](https://ja.wordpress.org/team/handbook/coding-standards/)
* [WordPress プラグイン開発ハンドブック](https://ja.wordpress.org/team/handbook/plugin-development/)

---

## 2. 仕様書の分割ガイド (AI 伴走開発向け)

本リポジトリでは、**1つの巨大な `SPEC.md` に集約せず、AI 伴走開発に最適化された粒度で仕様を分割** することを推奨します。  
各プラグイン側では `docs/` 配下に、用途別の仕様ファイルを用意してください (必要に応じて統合・分割して構いません)。

### 2.1. 推奨ファイル一覧 (ベター〜ベストプラクティス)

最低限おすすめするのは、**6〜8ファイル程度** の分割です。

1. `SPEC_OVERVIEW.md` - プロジェクトの存在理由
2. `SPEC_ARCHITECTURE.md` - コード構造と責務
3. `SPEC_UI_API_DATA.md` - 小〜中規模プラグイン向けに、下記3ファイルをまとめたもの
   1. `SPEC_UI_AND_FLOWS.md` - 管理画面、フロント UI と画面遷移
   2. `SPEC_API_AND_INTEGRATION.md` - REST API および外部サービス連携
   3. `SPEC_DATA_DICTIONARY.md` - データ、設定値、ストレージ定義
6. `SPEC_I18N_AND_A11Y.md` - 国際化/アクセシビリティ
7. `SPEC_TEST_AND_CICD.md` - テスト戦略、CI/CD
8. `SPEC_AI_COLLAB.md` - AI 伴走開発ルール

> テンプレートは、本リポジトリの `docs/PLUGIN_SPEC_*_TEMPLATE.md` を参照してください。

### 2.2. 粒度の目安 (どこまで分割するか)

* **ベター・プラクティス**:  
  * 上記8ファイルのうち、**最低4〜5個** (Overview / Architecture / UI / API / Data) は分割する。
* **ベスト・プラクティス (AI 伴走を本格運用)**:
  * 8ファイルすべてを用意し、各タスクで「参照する仕様ファイル」を AI に明示してから依頼する。
* **やりすぎ例 (避けたい)**:
  * 1コンポーネントごとや1エンドポイントごとに個別ファイルを乱立させる。 → 「検索性が下がり、AI に読み込ませるファイル選定も複雑になる」ため非推奨。

---

## 3. スタイル規約

### 3.1. W3C 仕様に準拠した主要 CSS プロパティのうち、em / rem 単位を受け付けるもの

以下は、ブラウザ差異を排除し、**CSS Level の3/4の安定仕様 (勧告・勧告候補の段階)** を基準にまとめています。

#### 3.1.1. 🧭 em / rem が利用可能な主要 CSS プロパティ一覧 (W3C 準拠)

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

#### 3.1.2. 🧩 単位別の注意点

| 単位 | 基準 | 主な用途 | 注意点 |
| --- | --- | --- | --- |
| `em` | 親要素の `font-size` | コンポーネント単位のスケーリング | ネストでサイズが累積変化する |
| `rem` | `html` 要素の `font-size` | ページ全体の一貫スケーリング | グローバルに統一可能 |
| `%` | コンテナの寸法 | レイアウト基準での相対指定 | フォントサイズには使えない |

#### 3.1.3. 📘 仕様参照 (W3C)

* [CSS Values and Units Module Level 3](https://www.w3.org/TR/css-values-3/#lengths)
* [CSS Box Model Level 3](https://www.w3.org/TR/css-box-3/)
* [CSS Fonts Level 4](https://www.w3.org/TR/css-fonts-4/)
* [CSS Backgrounds and Borders Level 3](https://www.w3.org/TR/css-backgrounds-3/)
* [CSS Transforms Level 2](https://www.w3.org/TR/css-transforms-2/)
* [CSS Grid Layout Level 2](https://www.w3.org/TR/css-grid-2/)
* [CSS Flexible Box Layout Module Level 1](https://www.w3.org/TR/css-flexbox-1/)

---

## 4. Backlog

> 実装する機能そのものではなく、「どの方向に進化させたいか」のメモを置く場所です。

* 本章では、「今後の予定」を記載します。
  * 短期的に追加したい機能:
  * 中長期的な構想:

* `templates/` ディレクトリに開発テンプレート一式を配置予定
  * サンプル `vite.config.ts`
  * サンプル `package.json`
  * サンプル `class-rest.php`
* OSS 化を想定し、Public リポジトリ版の `WP_PLUGIN_SPEC.md` を用意予定

---

## Appendix A: Git 運用ルール

* Git 管理下に含めるべきファイル・含めないファイルを明確にし、環境依存やビルド成果物を排除することで、再現性の高い開発環境を維持します。
* 新規の依存管理ツール導入時は `.gitignore` を更新し、Appendix A に追記してください。

### 1. 運用ルール

* `.gitignore` は、**リポジトリルートに設置** し、全員が共通利用します。

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

### 4. CI/テストとの連携ルール

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
