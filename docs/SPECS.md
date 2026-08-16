# wp-plugin-spec - 共通仕様

* 本ドキュメントは、本リポジトリ配下で開発する WordPress プラグインに共通する仕様を定義する。
* 各プラグインごとの個別仕様は、各リポジトリ内の `SPEC.md` および `docs/SPEC_*.md` に記載する。

## 1. 準拠ドキュメント

* [WordPress コーディング規約ハンドブック](https://ja.wordpress.org/team/handbook/coding-standards/)
* [WordPress プラグイン開発ハンドブック](https://ja.wordpress.org/team/handbook/plugin-development/)

## 2. 設計方針

* 規範は、次に限る。**ドメインは純関数、I/O はアダプタ。**  
* 関数型オブジェクト指向 (FOP) という名称や、CLI 向けの語彙 (サブコマンド、exit code、stdout / stderr、子プロセス) は、プラグイン仕様の規範にしない。
* ドメイン判断は、純関数。受け渡しは、イミュータブルな値。
* WordPress API / DB / HTTP / ファイルは、アダプタに閉じる。
* フック登録、REST、設定画面は、アダプタであり、クラスを使ってよい。
* 継承と巨大サービスは、使わない。
* Clean Architecture の用語は、依存の向き (内側= domain) だけ借りる。
* GoF デザインパターンの名称は、検討時の語彙に限り、実装のデフォルトにしない。
* エラーは、ランタイムの契約で表に出す (WP_Error / HTTP / notice。CLI の exit code は、スクリプトのみ)。

### 2.1. 関数型プログラミングの利点の借用

ロジック (ドメインの判断・変換・バリデーション) には、関数型プログラミングの **利点のみ** を借用します。クラス禁止ではありません。

* 同じ入力なら同じ出力になる、純関数にする。`get_option`、`$wpdb`、`wp_remote_*`、ファイル I/O を判断に混ぜない。
* 受け渡すまとまりは、クラス階層ではなくイミュータブルな値にする。
  * PHP: `readonly` の小さな値オブジェクト、または型を明示した配列
  * TypeScript: プレーンオブジェクト
* 処理は、関数の合成で組む。継承や巨大なサービスオブジェクト (`FooService` 等) は、使わない。
* 副作用は、アダプタに閉じる。

### 2.2. アダプタとクラス

* WordPress の境界は、アダプタとし、ここはクラスでよい (WPCS / Gutenberg の慣習に乗る)。

| アダプタの例 | 置き場所の目安 |
| --- | --- |
| フック登録、プラグイン bootstrap | 本体 PHP、登録用クラス |
| REST API | `includes/` の REST クラス |
| Settings API、管理画面 | `includes/` の設定画面クラス |
| ブロック登録、レンダリング | `includes/` のブロッククラス |
| `$wpdb`、Options / Meta、メディア、cron | アダプタ内の永続化 |
| `wp_remote_*` などの HTTP | アダプタ内のクライアント |
| React コンポーネント | `src/` の UI。ドメイン判断は `utils/` の純関数に |

REST コントローラが、DB アクセスとビジネス判断を兼ねてはなりません。コンポーネントに、条件分岐としてのドメイン判断を混ぜません。

CLI の実行単位は、プラグインでは下記に読み替えます。Presenter / Controller の機械的分割は、採用しません。

| CLI の語 (使わない) | プラグインでの実体 |
| --- | --- |
| サブコマンド | REST エンドポイント、フック、管理画面の操作、WP-CLI コマンド (任意) |
| exit code / stderr | `WP_Error`、HTTP ステータス、管理画面 notice、JS のエラー表示 |
| ファイル I/O、子プロセス | `$wpdb`、Options / Meta、`wp_remote_*`、メディア、cron |

### 2.3. Clean Coding との両立

* 関数は、小さく、名前で意図が読めるようにする。
* 関数は、1つにつき1責務。抽象度を混ぜない。
* エラーは、黙殺しない。契約は、ランタイム別に守る。
  * PHP: `WP_Error` を握りつぶさない。境界で例外を吸うなら、ログとユーザー向けメッセージを残す。
  * REST: ステータスとエラーコードを仕様に書く。
  * JS: 失敗を空の `catch` にしない。
  * exit code と stderr は、ビルド / CI スクリプトに限る。
* コメントは「なぜ」を書く。仕様の重複コピーは仕様書側に置く。

### 2.4. Clean Architecture の部分借用

フルセットの Clean Architecture は、採用しません。

* ドメインを I/O から独立させる。
* REST エンドポイント、フック、管理画面の操作、任意の WP-CLI をユースケースとして明示する。
* I/O をアダプタに寄せ、テストで差し替えやすくする。リポジトリインターフェースの量産は採用しない。
* 依存は内側 (domain) に向かわせる。DI コンテナや、フレームワーク非依存のための過剰なポートは採用しない。

### 2.5. GoF デザインパターン

* 仕様の検討段階では、共通語彙として GoF デザインパターンの名称を使ってよい。  
* 検討メモに限り、実装のデフォルトにはしない。コードにクラス階層やパターン実装を持ち込まない。

### 2.6. サードパーティ依存

サードパーティツールは、npm または PHP Composer 経由で導入します。例外は、下記のとおりです。

* WordPress 本体と `@wordpress/*` は、対象外 (実行時は WordPress が提供する)。
* テーマ / プラグイン同士の連携は、Composer より先に、存在チェックとフックで行う。
* 配布 Zip に `vendor/` を同梱するかは、WordPress.org / 社内配布 / GitHub Releases で分岐する。詳細は `ARCHITECTURE_TEMPLATE.md` の Composer 節を参照する。

## 3. 仕様書の分割ガイド (AI 伴走開発向け)

本リポジトリでは、**1つの巨大な `SPEC.md` に集約せず、AI 伴走開発に最適化された粒度で仕様を分割** することを推奨します。  
各プラグイン側では `docs/` 配下に、用途別の仕様ファイルを用意してください (必要に応じて統合・分割してかまいません)。

### 3.1. 推奨ファイル一覧 (ベター〜ベストプラクティス)

最低限おすすめするのは、**6〜8ファイル程度** の分割です。

1. `SPEC_OVERVIEW.md` - プロジェクトの存在理由
2. `SPEC_ARCHITECTURE.md` - コード構造と責務 (アダプタとドメインの境界を含む)
3. `SPEC_UI_API_DATA.md` - 小〜中規模プラグイン向けに、下記3ファイルをまとめたもの
   1. `SPEC_UI_AND_FLOWS.md` - 管理画面、フロント UI と画面遷移
   2. `SPEC_API_AND_INTEGRATION.md` - REST API および外部サービス連携
   3. `SPEC_DATA_DICTIONARY.md` - データ、設定値、ストレージ定義
4. `SPEC_I18N_AND_A11Y.md` - 国際化/アクセシビリティ
5. `SPEC_TEST_AND_CICD.md` - テスト戦略、CI/CD
6. `SPEC_AI_COLLAB.md` - AI 伴走開発ルール

ひな型は、本リポジトリの `docs/*_TEMPLATE.md` を参照してください。

### 3.2. 粒度の目安 (どこまで分割するか)

* **ベター・プラクティス**:
  * 上記8ファイルのうち、**最低4〜5個** (Overview / Architecture / UI / API / Data) は分割する。
* **ベスト・プラクティス (AI 伴走を本格運用)**:
  * 8ファイルすべてを用意し、各タスクで「参照する仕様ファイル」を AI に明示してから依頼する。
* **やりすぎ例 (避けたい)**:
  * 1コンポーネントごとや1エンドポイントごとに個別ファイルを乱立させる。→「検索性が下がり、AI に読み込ませるファイル選定も複雑になる」ため非推奨。

## 4. ドキュメント命名規則とライフサイクル

### 4.1. ファイル名

* ASCII のみ (英数字、ハイフン)。日本語やスペースは使わない。

### 4.2. タイトル

各ファイルの1行目 (HTML コメントを除く最初の見出し) は、下記の形式とします。

* 本リポジトリ: `# wp-plugin-spec - …`
* 各プラグインにコピーした仕様: `# <plugin-slug> - …`
* 本リポジトリ内のひな型: `# wp-plugin-spec - … (ひな型)`

### 4.3. 仕様書のライフサイクル

| 種別 | 場所 |
| --- | --- |
| 草案 | `./docs_mod/` |
| 公開正本 (確定後) | `./docs/` |
| freeze した旧正本 | `./docs/archive/<initiative>/` |

1. 草案: `./docs_mod/` で編集する。
2. 確定: 現行の `./docs/*.md` があれば `./docs/archive/<initiative>/` に移動して freeze する。
3. 公開正本: 編集確定版を `./docs/` に移動する。

* `<initiative>` は、initiative ごとに適切な、簡潔な英文名のサブフォルダーとする (例: `adapter-and-pure-domain`)。
* 小さな typo 程度なら、草案は起こさなくてよい。公開正本を直接直してよい。
* `*_TEMPLATE.md` はひな型である。typo 以外のリライトは archive 対象とする。ひな型の日常利用 (コピー先での記入) は archive しない。

### 4.4. テスト結果は仕様ライフサイクルの対象外

`docs/test-results.md` は **生成物** です。CI (または同等のテストランナー) が書き、人が読みます。手編集の草案と同じ流れに乗せません。

## 5. テスト

* 自動テストを実施する。
* 実施済 / 実施残は、各リポジトリの `./docs/test-results.md` でわかるようにする (生成物。§4.4)。

### 5.1. 結果マーク

* WARN には、理由と期限、または「環境 X では検証しない」を必須とする。期限のない WARN を常設しない。
* SKIP は「実行していない」。WARN は「実行したが未達を許容した」。混ぜない。

| マーク | 意味 |
| --- | --- |
| PASS | 条件を満たす |
| WARN | 条件未達だが、意図的に許容する |
| SKIP | 環境がなく、今回は実行しない |
| PENDING (自動) | 自動テスト未実装 |
| FAIL | 条件未達 (要修正) |

### 5.2. 対象の分類

詳細なジョブ設計は、ひな型 `TEST_AND_CICD_TEMPLATE.md` (各プラグインでは `SPEC_TEST_AND_CICD.md`) に書きます。共通の分類は下記のとおりです。

* PHPUnit: ドメインの純関数を厚くする
* PHPCS / PHPStan
* ESLint / `tsc`
* Playwright: 管理画面・ブロック。環境依存は SKIP または WARN の主戦場とする

## 6. スタイル規約

### 6.1. W3C 仕様に準拠した主要 CSS プロパティのうち、em / rem 単位を受け付けるもの

下記は、ブラウザ差異を排除し、**CSS Level の3/4の安定仕様 (勧告・勧告候補の段階)** を基準にまとめています。

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

## 7. Backlog

実装する機能そのものではなく、「どの方向に進化させたいか」のメモを置く場所です。

* 本章では、「今後の予定」を記載する。
  * 短期的に追加したい機能:
  * 中長期的な構想:

* `templates/` ディレクトリに開発テンプレート一式を配置予定
  * サンプル `vite.config.ts`
  * サンプル `package.json`
  * サンプル `class-rest.php`
  * PHPCS 設定、`docs/test-results.md` 生成スクリプト
* OSS 化を想定し、Public リポジトリ版の `SPECS.md` を用意予定

## Appendix A: Git 運用ルール

* Git 管理下に含めるべきファイル・含めないファイルを明確にし、環境依存やビルド成果物を排除することで、再現性の高い開発環境を維持する。
* 新規の依存管理ツール導入時は `.gitignore` を更新し、Appendix A に追記する。
* `docs/test-results.md` を生成物としてコミットするかは、各リポジトリで決める。生成コマンドと CI ジョブは仕様に書く。

### 1. 運用ルール

* `.gitignore` は、**リポジトリルートに設置** し、全員が共通利用する。

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
* `docs/test-results.md` をコミットする場合は、生成物であることを README または本仕様で明示する

* Issue と Pull Request は必ず紐付ける (`close #123` など)。
* Pull Request には、対応する SPEC セクションを記載し、レビュー効率を高める。
* CI/CD (例: GitHub Actions) を利用して lint/test を自動化する。

## FAQ: 削除ファイルの扱い

### Q1. ローカルで削除したが、まだコミットしていない場合に「Hunk を戻す」を押すと ?

* 削除が取り消され、ファイルは直前の Git 管理下の内容で復活する。

### Q2. ローカルで削除をコミット済みの場合に「Hunk を戻す」を押すと ?

* すでに履歴に削除が残っているため、そのままでは復活しない。復元するには `git restore` や「履歴から復元」を実行する必要がある。

### Q3. リモート (GitHub) 側で削除されたが、ローカルにファイルが残っている場合は ?

* **まだ pull していない場合**: ローカルの Git クライアントは削除を認識していないため、削除差分そのものが表示されない。この場合「Hunk を戻す」対象にならない。
* **pull 済みで削除差分が反映された場合**: ローカルの Git クライアント上で「削除されたファイル」と表示される。ここで「Hunk を戻す」を押すと、削除が取り消されファイルが復活する。
* **pull 済みでローカルに未コミット変更がある場合**「リモート削除 vs ローカル変更」の競合になる。この場合「Hunk を戻す」を押すと、削除が取り消され、ローカル編集を残したままファイルが復活する。
